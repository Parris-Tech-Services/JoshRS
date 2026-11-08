/**
 * Revision-377 effect evidence from two real, authenticated, same-account
 * server observations. Never uses "packet sent" or "tick advanced" as
 * evidence a gameplay action succeeded. A source-level packet mapping and
 * a verified effect are separate acceptance dimensions.
 */
const count=(items,id)=>{
 if(!Array.isArray(items)||!Number.isSafeInteger(id))return null;
 return items.filter(i=>i?.id===id).reduce((n,i)=>n+(i.count||0),0);
};
const change=(a,b,id)=>{
 const x=count(a,id),y=count(b,id);
 return x===null||y===null?null:y-x;
};
const p=(s)=>s?.sdkDetails;
const questChanged=(a,b)=>{
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 return Object.keys(a).some(k=>Number.isSafeInteger(a[k])&&Number.isSafeInteger(b[k])&&a[k]!==b[k]);
};
const skillXpChanged=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
  a.some(x=>{const y=b.find(t=>t.name===x.name);
    return y&&Number.isSafeInteger(y.xpTenths)&&y.xpTenths>x.xpTenths});
const pageChanged=(a,b)=>{
 if(!a||!b)return false;
 return a.pageId!==b.pageId&&
  (Boolean(a.pageId)||Boolean(b.pageId));
};
const uiOpened=(a,b,field)=>p(a)?.[field]?.isOpen!==true && p(b)?.[field]?.isOpen===true;
const uiClosed=(a,b,field)=>p(a)?.[field]?.isOpen===true && p(b)?.[field]?.isOpen===false;
const event=(name)=>Object.freeze({verified:true,evidence:name});
const itemAt=(s,slot,list)=>Array.isArray(list)?list.find(x=>x.slot===slot):null;
function inventoryChanged(a,b){
 if(!Array.isArray(a)||!Array.isArray(b))return false;
 const ids=new Set([...a.map(x=>x.id),...b.map(x=>x.id)]);
 return [...ids].some(id=>change(a,b,id)!==0);
}
function ownMessageAfter(a,b,type){
 const before=p(a)?.gameMessages,after=p(b)?.gameMessages;
 if(!Array.isArray(before)||!Array.isArray(after))return false;
 const seen=new Set(before.map(x=>[x.tick,x.type,x.text,x.sender].join('|')));
 return after.some(x=>x.fromSelf===true&&
   x.type===type&&x.tick>a.tick&&
   !seen.has([x.tick,x.type,x.text,x.sender].join('|')));
}
export function verifyActionEffect(action,before,after){
 if(!action||!before||!after||after.tick<=before.tick||
    before.world?.instanceId!==after.world?.instanceId||
    before.player?.username!==after.player?.username||
    before.world?.sourceSha!==after.world?.sourceSha)return null;
 const a=action.type;
 const inventoryBefore=before.inventory,inventoryAfter=after.inventory;
 const bankBefore=p(before)?.bank?.items,bankAfter=p(after)?.bank?.items;
 const shopBefore=p(before)?.shop?.shopItems,shopAfter=p(after)?.shop?.shopItems;
 const afterQuest=questChanged(before.questStages,after.questStages);
 const inventoryDiff=inventoryChanged(inventoryBefore,inventoryAfter);
 const skillDiff=skillXpChanged(before.skills,after.skills);
 if(a==='dropItem'){
  const id=itemAt(before,action.slot,inventoryBefore)?.id;
  return change(inventoryBefore,inventoryAfter,id)<0?event('item_removed_from_backpack'):null;
 }
 if(a==='pickupItem')
  return change(inventoryBefore,inventoryAfter,action.itemId)>0?event('ground_item_added_to_backpack'):null;
 if(a==='useEquipmentItem'){
  const item=itemAt(before,action.slot,before.equipment);
  return item&&change(before.equipment,after.equipment,item.id)<0?
   event('equipment_slot_changed'):null;
 }
 if(a==='shopBuy'){
  const id=itemAt(before,action.slot,shopBefore)?.id;
  const acquired=change(inventoryBefore,inventoryAfter,id);
  const sold=change(shopBefore,shopAfter,id);
  return Number.isSafeInteger(acquired)&&acquired===action.amount&&sold===-action.amount?
   event('shop_stock_and_backpack_changed_by_exact_quantity'):null;
 }
 if(a==='shopSell'){
  const item=itemAt(before,action.slot,p(before)?.shop?.playerItems);
  const id=item?.id;const sold=change(inventoryBefore,inventoryAfter,id);
  return sold===-action.amount&&change(shopBefore,shopAfter,id)===action.amount?
   event('shop_stock_and_backpack_changed_by_exact_quantity'):null;
 }
 if(a==='bankDeposit'){
  const id=itemAt(before,action.slot,inventoryBefore)?.id;
  return change(inventoryBefore,inventoryAfter,id)===-action.amount&&
    change(bankBefore,bankAfter,id)===action.amount?
    event('bank_and_backpack_changed_by_exact_quantity'):null;
 }
 if(a==='bankWithdraw'){
  const id=itemAt(before,action.slot,bankBefore)?.id;
  return change(bankBefore,bankAfter,id)===-action.amount&&
    change(inventoryBefore,inventoryAfter,id)===action.amount?
    event('bank_and_backpack_changed_by_exact_quantity'):null;
 }
 if(a==='togglePrayer'){
  const x=p(before)?.prayers?.activePrayers?.[action.prayerIndex];
  const y=p(after)?.prayers?.activePrayers?.[action.prayerIndex];
  return typeof x==='boolean'&&typeof y==='boolean'&&x!==y?
   event('native_prayer_varp_changed'):null;
 }
 if(a==='setCombatStyle'){
  return p(after)?.combatStyle?.currentStyle===action.style &&
    p(before)?.combatStyle?.currentStyle!==action.style?
    event('native_combat_style_changed'):null;
 }
 if(a==='closeShop')return uiClosed(before,after,'shop')?event('native_shop_closed'):null;
 if(a==='closeModal')return p(before)?.modalOpen===true&&p(after)?.modalOpen===false?
    event('native_modal_closed'):null;
 if(a==='say')return ownMessageAfter(before,after,2)?
   event('native_echoed_own_public_chat'):null;
 if(a==='privateMessage')return ownMessageAfter(before,after,6)?
   event('native_echoed_own_private_message'):null;
 if(a==='clickDialogOption')return pageChanged(before.dialogue,after.dialogue)||
    afterQuest?event('native_dialogue_page_or_quest_progress_changed'):null;
 if(a==='talkToNpc'||a==='interactNpc'){
  return pageChanged(before.dialogue,after.dialogue)||uiOpened(before,after,'shop')||
   uiOpened(before,after,'bank')||afterQuest?
    event('native_dialogue_shop_bank_or_quest_changed'):null;
 }
 if(a==='useItemOnItem'||a==='useItemOnNpc'||a==='useItemOnLoc'||
    a==='useInventoryItem'||a==='clickComponentWithOption'){
  return inventoryDiff||skillDiff||afterQuest?
   event('native_inventory_skill_or_quest_state_changed'):null;
 }
 if(a==='interactLoc'||a==='clickComponent'){
  return uiOpened(before,after,'shop')||uiOpened(before,after,'bank')||
   pageChanged(before.dialogue,after.dialogue)||afterQuest||
   inventoryDiff||skillDiff?
   event('native_interface_quest_or_inventory_state_changed'):null;
 }
 if(a==='submitCountDialog'){
  return p(before)?.countDialog?.isOpen===true&&
    p(after)?.countDialog?.isOpen===false&&
    (inventoryDiff||change(bankBefore,bankAfter,995)!==0)?
    event('native_count_dialog_completed_with_inventory_change'):null;
 }
 if(['spellOnNpc','spellOnPlayer','spellOnItem','spellOnGroundItem'].includes(a)){
  return skillDiff||inventoryDiff?
   event('native_magic_xp_or_inventory_changed'):null;
 }
 if(a==='interactPlayer'){
  return uiOpened(before,after,'trade')?
   event('native_trade_ui_opened'):null;
 }
 return null; // Unknown client effects are never given synthetic success.
}
