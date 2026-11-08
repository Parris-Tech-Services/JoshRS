/**
 * Upstream BotAction variants beyond the original rev377 eleven.
 * All packets are original ClientGameProt layouts. The player, NPC, target
 * item and open-UI values are read from the isolated native bot observer.
 * Unsupported client-only actions fail CLOSED; no game save/XP writes.
 */
import {buildAction} from './protocol.mjs';
import {SDK377_ACTION_COVERAGE} from './sdk-action-coverage.mjs';

const fail=(why)=>{throw new Error('SDK action refused: '+why)};
const integer=(n,max=65535)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const validOp=n=>integer(n,5)&&n>0;
const packet=a=>Object.freeze({
 kind:'packet',packet:buildAction(a),result:'dispatched_unverified'
});
const dataOnly=a=>a!==null&&typeof a==='object'&&!Array.isArray(a);
function exact(a,fields){
 if(!dataOnly(a)||typeof a.type!=='string')fail('typed action required');
 if(typeof a.reason!=='string'||a.reason.length>180)fail('bounded reason required');
 const others=Object.keys(a).filter(k=>!['type','reason',...fields].includes(k));
 if(others.length)fail('unexpected action fields: '+others.join(','));
}
function requiredItem(items,slot,name,maxSlot=27){
 if(!integer(slot,maxSlot)||!Array.isArray(items))
  fail(name+' inventory not observed');
 const item=items.find(i=>i.slot===slot);
 if(!item||!integer(item.id))fail(name+' slot/item not observed');
 return item;
}
function requiredNpc(s,index){
 if(!integer(index)||!Array.isArray(s.nearbyNpcs)||
    !s.nearbyNpcs.some(n=>n.index===index))fail('NPC not visible to isolated bot');
}
function requiredPlayer(s,index){
 const list=s.sdkDetails?.nearbyPlayers;
 if(!integer(index)||!Array.isArray(list)||!list.some(p=>p.index===index))
  fail('other player not visible to isolated bot');
}
function spell(s,component){
 // A spell component cannot be inferred from the spell ID or combat level.
 // Only an actual visible/reported native client's magic widget may select it.
 if(!integer(component)||!Array.isArray(s.sdkDetails?.visibleSpellComponents)||
    !s.sdkDetails.visibleSpellComponents.includes(component))
  fail('spell selection must be visible in native 377 client magic tab');
}
function selectedComponent(s,id){
 if(!integer(id))fail('component ID out of range');
 const actual=s.sdkDetails?.interface;
 if(actual?.isOpen!==true||!Array.isArray(actual.options)||
    !actual.options.some(x=>x.componentId===id))
  fail('UI button is not currently offered by the native client');
}
function amountOption(amount,item){
 if(!integer(amount,2147483647)||amount<1)
  fail('quantity must be a positive 32-bit integer');
 if(amount===1)return 1;
 if(amount===5)return 2;
 if(amount===10)return 3;
 if(item?.count===amount)return 4;
 fail('quantity needs a verified amount-X dialogue; only 1, 5, 10 or all are currently mapped');
}
function shopItem(s,side,slot){
 const shop=s.sdkDetails?.shop;
 if(shop?.isOpen!==true)fail('real shop UI not open');
 const items=side==='buy'?shop.shopItems:shop.playerItems;
 return requiredItem(items,slot,side==='buy'?'shop-stock':'shop-player',side==='buy'?65535:27);
}
function bankItem(s,side,slot){
 const bank=s.sdkDetails?.bank;
 if(bank?.isOpen!==true)fail('real bank UI not open');
 return requiredItem(side==='withdraw'?bank.items:s.inventory,slot,side==='withdraw'?'bank':'player');
}
const PRAYER_WIDGETS=Object.freeze([
 5609,5610,5611,5612,5613,5614,5615,5616,
 5617,5618,5619,5620,5621,5622,5623
]);
const PRAYER_LEVELS=Object.freeze([1,4,7,10,13,16,19,22,25,28,31,34,37,40,43]);
function readNearby(s,field,radius){
 if(radius===undefined)radius=16;
 if(!integer(radius,16)||radius<1)
  fail('scan radius must be 1..16 native tiles');
 if(s.position===null)fail('scan requires actual native player position');
 const list=s[field];
 if(!Array.isArray(list))fail('native '+field+' visibility not observed');
 // Existing native observer caps to 48 and restricts to current plane.
 const view=list.filter(item=>{
  const d=Math.max(Math.abs(item.x-s.position.x),Math.abs(item.z-s.position.z));
  return d<=radius && (item.level===undefined||item.level===s.position.plane);
 }).slice(0,48);
 return Object.freeze({kind:'read',tick:s.tick,
   readType:field,data:structuredClone(view),verifiedEffect:false});
}

export function mapExtendedSdkAction(a,s){
 if(!dataOnly(a)||!Object.hasOwn(SDK377_ACTION_COVERAGE,a.type))
  fail('unknown upstream action type');
 switch(a.type){
  case 'interactPlayer':{
   exact(a,['playerIndex','optionIndex']);
   requiredPlayer(s,a.playerIndex);
   if(!validOp(a.optionIndex))fail('player menu option must be 1..5');
   return packet({type:'player',playerSlot:a.playerIndex,option:a.optionIndex});
  }
  case 'clickComponent':{
   exact(a,['componentId']);
   selectedComponent(s,a.componentId);
   return packet({type:'if_button',componentId:a.componentId});
  }
  case 'clickComponentWithOption':{
   exact(a,['componentId','optionIndex','slot']);
   if(!validOp(a.optionIndex)||!integer(a.slot,65535))
    fail('visible item component, slot and 1..5 option required');
   const com=a.componentId;
   let item;
   if(com===3214){item=requiredItem(s.inventory,a.slot,'player');}
   else if(com===3900){item=shopItem(s,'buy',a.slot)}
   else if(com===3823){item=shopItem(s,'sell',a.slot)}
   else if(com===5382){item=bankItem(s,'withdraw',a.slot)}
   else if(com===2006){item=bankItem(s,'deposit',a.slot)}
   else fail('component inventory is not source-mapped to a visible native UI');
   if(com===3214&&a.slot>27)fail('player inventory slot must be 0..27');
   return packet({type:com===3214?'held':'inventory',
      componentId:com,slot:a.slot,itemId:item.id,option:a.optionIndex});
  }
  case 'useEquipmentItem':{
   exact(a,['slot','optionIndex']);
   const item=requiredItem(s.equipment,a.slot,'worn');
   if(!validOp(a.optionIndex))fail('equipment option must be 1..5');
   // The actual wornitems:wear interface component is client-specific.
   // Do not infer its ID from wornitems:worn (different named component).
   const component=s.sdkDetails?.equipmentComponentId;
   if(!integer(component))fail('native wornitems:wear component not observed');
   return packet({type:'inventory',componentId:component,
     slot:a.slot,itemId:item.id,option:a.optionIndex});
  }
  case 'dropItem':{
   exact(a,['slot']);
   const item=requiredItem(s.inventory,a.slot,'player');
   // Pinned scripts/player/scripts/drop.rs2: [opheld5,_] dropslot.
   return packet({type:'held',componentId:3214,slot:a.slot,
     itemId:item.id,option:5});
  }
  case 'shopBuy':{
   exact(a,['slot','amount']);
   const item=shopItem(s,'buy',a.slot);
   const op=amountOption(a.amount,item);
   if(op===4)fail('shop has only buy 1/5/10, not buy-all');
   // Pinned shop.rs2: shop_template:inv 3900, buttons 2/3/4.
   return packet({type:'inventory',componentId:3900,slot:a.slot,
     itemId:item.id,option:op+1});
  }
  case 'shopSell':{
   exact(a,['slot','amount']);
   const item=shopItem(s,'sell',a.slot);
   const op=amountOption(a.amount,item);
   if(op===4)fail('shop has only sell 1/5/10, not sell-all');
   // Pinned shop.rs2: shop_template_side:inv 3823, buttons 2/3/4.
   return packet({type:'inventory',componentId:3823,slot:a.slot,
     itemId:item.id,option:op+1});
  }
  case 'closeShop':{
   exact(a,[]);
   if(s.sdkDetails?.shop?.isOpen!==true||s.sdkDetails?.modalOpen!==true)
    fail('no observed open shop modal');
   return packet({type:'close_modal'});
  }
  case 'closeModal':{
   exact(a,[]);
   if(s.sdkDetails?.modalOpen!==true)fail('no observed open modal');
   return packet({type:'close_modal'});
  }
  case 'setCombatStyle':{
   exact(a,['style']);
   const x=s.sdkDetails?.combatStyle;
   if(x?.known!==true||!Array.isArray(x.styles))fail('combat-style UI not observed');
   const chosen=x.styles.find(v=>v.index===a.style);
   if(!chosen||!integer(chosen.componentId))
    fail('requested combat style does not have an observed component');
   return packet({type:'if_button',componentId:chosen.componentId});
  }
  case 'useItemOnItem':{
   exact(a,['sourceSlot','targetSlot']);
   if(a.sourceSlot===a.targetSlot)fail('item target must differ from source');
   const src=requiredItem(s.inventory,a.sourceSlot,'source');
   const dst=requiredItem(s.inventory,a.targetSlot,'target');
   return packet({type:'item_on_item',sourceItemId:src.id,
     sourceSlot:a.sourceSlot,targetItemId:dst.id,targetSlot:a.targetSlot,
     componentId:3214});
  }
  case 'useItemOnNpc':{
   exact(a,['itemSlot','npcIndex']);
   requiredNpc(s,a.npcIndex);
   const item=requiredItem(s.inventory,a.itemSlot,'source');
   return packet({type:'item_on_npc',npcSlot:a.npcIndex,
     itemId:item.id,slot:a.itemSlot,componentId:3214});
  }
  case 'say':{
   exact(a,['message']);
   return packet({type:'chat_plain',message:a.message});
  }
  case 'privateMessage':{
   exact(a,['targetName','message']);
   return packet({type:'private_chat',targetName:a.targetName,message:a.message});
  }
  case 'spellOnNpc':{
   exact(a,['npcIndex','spellComponent']);
   requiredNpc(s,a.npcIndex);spell(s,a.spellComponent);
   return packet({type:'spell_on_npc',npcSlot:a.npcIndex,
     spellComponent:a.spellComponent});
  }
  case 'spellOnPlayer':{
   exact(a,['playerIndex','spellComponent']);
   requiredPlayer(s,a.playerIndex);spell(s,a.spellComponent);
   return packet({type:'spell_on_player',playerSlot:a.playerIndex,
     spellComponent:a.spellComponent});
  }
  case 'spellOnItem':{
   exact(a,['slot','spellComponent']);
   const item=requiredItem(s.inventory,a.slot,'target');spell(s,a.spellComponent);
   return packet({type:'spell_on_item',componentId:3214,
     slot:a.slot,itemId:item.id,spellComponent:a.spellComponent});
  }
  case 'spellOnGroundItem':{
   exact(a,['x','z','itemId','spellComponent']);
   if(!Array.isArray(s.groundItems)||!s.groundItems.some(v=>
     v.x===a.x&&v.z===a.z&&v.id===a.itemId))
     fail('ground spell target not observed');
   spell(s,a.spellComponent);
   return packet({type:'spell_on_ground',x:a.x,z:a.z,
     itemId:a.itemId,spellComponent:a.spellComponent});
  }
  case 'bankDeposit':{
   exact(a,['slot','amount']);
   const item=bankItem(s,'deposit',a.slot);
   const op=amountOption(a.amount,item);
   // Pinned bank_deposit.rs2: bank_side:inv 2006, buttons 1/2/3/4.
   return packet({type:'inventory',componentId:2006,slot:a.slot,
     itemId:item.id,option:op});
  }
  case 'bankWithdraw':{
   exact(a,['slot','amount']);
   const item=bankItem(s,'withdraw',a.slot);
   const op=amountOption(a.amount,item);
   // Pinned bank.rs2: bank_main:bank 5382, buttons 1/2/3/4.
   return packet({type:'inventory',componentId:5382,slot:a.slot,
     itemId:item.id,option:op});
  }
  case 'submitCountDialog':{
   exact(a,['value']);
   const dialog=s.sdkDetails?.countDialog;
   if(dialog?.isOpen!==true||dialog.kind!=='number'||
      dialog.tick!==s.tick)
    fail('numeric count dialog not observed in this actual native 377 tick');
   return packet({type:'resume_count',value:a.value});
  }
  case 'togglePrayer':{
   exact(a,['prayerIndex']);
   if(!integer(a.prayerIndex,14))fail('prayer index must be 0..14');
   const p=s.sdkDetails?.prayers;
   if(!Array.isArray(p?.activePrayers)||p.activePrayers.length!==15)
    fail('native prayer state not observed');
   if(p.prayerLevel<PRAYER_LEVELS[a.prayerIndex])
    fail('base prayer level too low');
   if(p.prayerPoints<1&&!p.activePrayers[a.prayerIndex])
    fail('no prayer points');
   // Pinned pack/interface.pack: prayer:prayer_thickskin 5609 through
   // prayer:prayer_protectfrommelee 5623 in upstream SDK index order.
   return packet({type:'if_button',componentId:PRAYER_WIDGETS[a.prayerIndex]});
  }
  case 'scanNearbyLocs':{
   exact(a,['radius']);
   return readNearby(s,'nearbyLocs',a.radius);
  }
  case 'scanGroundItems':{
   exact(a,['radius']);
   return readNearby(s,'groundItems',a.radius);
  }
  case 'setTab':{
   exact(a,['tabIndex']);
   fail('setTab is an enhanced client-local action; TCP TUT_CLICKSIDE does not change the Java 377 client UI');
  }
  case 'acceptCharacterDesign':{
   exact(a,[]);
   fail('character appearance is hidden client-local state; 377 design values must be observed before sending IDK_SAVEDESIGN');
  }
  case 'randomizeCharacterDesign':{
   exact(a,[]);
   fail('randomizeCharacterDesign needs a real 377 client appearance adapter; do not invent body kits or colours');
  }
  case 'searchGE':{
   exact(a,['query']);
   fail('Grand Exchange search is absent from pinned 2004-era revision 377 content');
  }
 }
 fail('pinned upstream action has no native implementation: '+String(a.type));
}
