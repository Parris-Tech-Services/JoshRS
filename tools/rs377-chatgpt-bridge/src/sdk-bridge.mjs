/**
 * Pinned MaxBittker/rs-sdk@db0cc51e (sdk/types.ts BotAction/BotWorldState).
 * Explicitly maps *observed* rev377 state and semantic normal-player actions.
 * Does not run RS-SDK, a gateway, a TCP game decoder or a privileged observer.
 */
import {buildAction} from './protocol.mjs';
import {validateObservation} from './observation.mjs';
import {mapExtendedSdkAction} from './sdk-action-extensions.mjs';

const requiredExtra=['player','nearbyPlayers','gameMessages','recentDialogs','interface',
  'shop','bank','modalOpen','modalInterface','combatEvents','prayers'];
const missing=(name)=>{throw new Error('SDK state incomplete: '+name+' is not verified by the native observer')};
const isNum=v=>Number.isSafeInteger(v)&&v>=0;
const validOption=(v)=>isNum(v)&&v>=1&&v<=5;
const reject=(why)=>{throw new Error('SDK action refused: '+why)};
const pickSlot=(items,slot)=>Array.isArray(items)&&items.find(i=>i.slot===slot);
function verifiedNpc(snapshot,index) {
  if(!Array.isArray(snapshot.nearbyNpcs))reject('NPC visibility unknown');
  if(!snapshot.nearbyNpcs.some(n=>n.index===index))reject('NPC is not visible to this bot');
}
function verifiedLoc(snapshot,a) {
  if(!Array.isArray(snapshot.nearbyLocs))reject('location visibility unknown');
  if(!snapshot.nearbyLocs.some(n=>n.id===a.locId&&n.x===a.x&&n.z===a.z))
    reject('location is not visible on this tile');
}
function verifiedGround(snapshot,a) {
  if(!Array.isArray(snapshot.groundItems))reject('ground items unknown');
  if(!snapshot.groundItems.some(n=>n.id===a.itemId&&n.x===a.x&&n.z===a.z))
    reject('ground item is not visible');
}
const dataOnly=arg=>arg&&typeof arg==='object'&&!Array.isArray(arg);
function exact(action,fields) {
  if(!dataOnly(action)||typeof action.type!=='string')reject('typed action required');
  const other=Object.keys(action).filter(k=>!['type','reason',...fields].includes(k));
  if(other.length)reject('unexpected fields');
  if(typeof action.reason!=='string'||action.reason.length>180)reject('bounded reason required');
}
const packet=(a)=>Object.freeze({kind:'packet',packet:buildAction(a),result:'dispatched_unverified'});
/**
 * Intentionally no arbitrary SDK action pass-through. An action can only
 * target already-observed entities, a known inventory slot, or a guarded dialog.
 */
export function mapSdkAction(action,snapshot,{approvedFamily=false}={}) {
  if(!snapshot||snapshot.world?.revision!==377||
    !(snapshot.world.mode==='isolated'||(approvedFamily===true&&
      snapshot.world.mode==='family'&&snapshot.world.instanceId==='family-joshrs-377'&&
      snapshot.player?.username==='HarnessView1')))
    reject('validated isolated or approved family-377 bot snapshot required');
  try{validateObservation(snapshot,{botName:snapshot.player?.username,
    expectedWorld:snapshot.world.instanceId,approvedFamily})}catch{reject('unverified bot/world observation')}
  const a=action;
  switch(a?.type) {
    case 'none':exact(a,[]);return Object.freeze({kind:'no_action'});
    case 'wait':exact(a,['ticks']);if(a.ticks!==undefined&&(!isNum(a.ticks)||a.ticks>20))reject('wait tick bound');return Object.freeze({kind:'wait',ticks:a.ticks??1});
    case 'walkTo': {
      exact(a,['x','z','running']);
      if(snapshot.position===null)reject('cannot walk without observed position');
      if(Math.max(Math.abs(a.x-snapshot.position.x),Math.abs(a.z-snapshot.position.z))>104)
        reject('destination is too distant for normal 377 click');
      return packet({type:'walk',x:a.x,z:a.z,running:a.running??false});
    }
    case 'talkToNpc': {
      exact(a,['npcIndex']);verifiedNpc(snapshot,a.npcIndex);
      return packet({type:'npc',npcSlot:a.npcIndex,option:1});
    }
    case 'interactNpc': {
      exact(a,['npcIndex','optionIndex']);verifiedNpc(snapshot,a.npcIndex);
      if(!validOption(a.optionIndex))reject('NPC option must be 1..5');
      return packet({type:'npc',npcSlot:a.npcIndex,option:a.optionIndex});
    }
    case 'interactLoc': {
      exact(a,['x','z','locId','optionIndex']);verifiedLoc(snapshot,a);
      if(!validOption(a.optionIndex))reject('location option must be 1..5');
      return packet({type:'loc',x:a.x,z:a.z,locId:a.locId,option:a.optionIndex});
    }
    case 'pickupItem': {
      exact(a,['x','z','itemId']);verifiedGround(snapshot,a);
      return packet({type:'ground',x:a.x,z:a.z,itemId:a.itemId,option:1});
    }
    case 'interactGroundItem': {
      exact(a,['x','z','itemId','optionIndex']);verifiedGround(snapshot,a);
      if(!validOption(a.optionIndex))reject('ground option must be 1..5');
      return packet({type:'ground',x:a.x,z:a.z,itemId:a.itemId,option:a.optionIndex});
    }
    case 'useInventoryItem': {
      exact(a,['slot','optionIndex','interfaceId']);
      const item=pickSlot(snapshot.inventory,a.slot);
      if(!item)reject('inventory slot not observed');
      if(!validOption(a.optionIndex))reject('inventory option must be 1..5');
      // The upstream BotSDK defaults the main backpack interface to 3214.
      // That component is pinned in native Content and always represents the
      // already-observed backpack item, so omitting it is not a guessed UI.
      const com=a.interfaceId??3214;
      if(!Number.isSafeInteger(com)||com<0||com>65535)
        reject('invalid interface component');
      if(com===3214) {
        return packet({type:'held',slot:a.slot,itemId:item.id,
          componentId:com,option:a.optionIndex});
      }
      // Alternative components are legal only while the corresponding native
      // side inventory is actually open. Never click arbitrary interface IDs.
      if(!((com===2006&&snapshot.sdkDetails?.bank?.isOpen===true)||
           (com===3823&&snapshot.sdkDetails?.shop?.isOpen===true)))
        reject('other inventory component not observed as an open native side UI');
      return packet({type:'inventory',slot:a.slot,itemId:item.id,
        componentId:com,option:a.optionIndex});
    }
    case 'useItemOnLoc': {
      exact(a,['itemSlot','x','z','locId']);verifiedLoc(snapshot,a);
      const item=pickSlot(snapshot.inventory,a.itemSlot);
      if(!item)reject('inventory item slot not observed');
      return packet({type:'item_on_loc',slot:a.itemSlot,itemId:item.id,
        componentId:3214,x:a.x,z:a.z,locId:a.locId});
    }
    case 'clickDialogOption': {
      exact(a,['optionIndex','guard']);
      const d=snapshot.dialogue;
      if(!d||!d.isOpen||!d.pageId)reject('no verified active dialogue page');
      if(!a.guard||a.guard.pageId!==d.pageId)reject('stale or unguarded dialogue');
      const opt=d.options.find(o=>o.index===a.optionIndex&&o.componentId===a.guard.componentId);
      if(!opt)reject('dialogue option no longer available');
      // The verified pending component is exactly what the native server's
      // RESUME_PAUSEBUTTON decoder expects. This is an ordinary 377 packet,
      // not a privileged script invocation or a guessed interface click.
      if(!Number.isSafeInteger(opt.componentId)||opt.componentId<0||
         opt.componentId>65535||!snapshot.dialogue.pendingComponentIds?.includes(opt.componentId))
         reject('component not pending in actual native dialogue script');
      return packet({type:'dialog_resume',componentId:opt.componentId});
    }
    default:return mapExtendedSdkAction(a,snapshot);
  }
}
// The following validators mirror all REQUIRED properties at the pinned
// MaxBittker/rs-sdk sdk/types.ts blob ec59cef4... . Optional properties are
// not invented. Refuse an incomplete game source rather than emit fake state.
const isBool=x=>typeof x==='boolean';
const isStr=x=>typeof x==='string';
const isInteger=x=>Number.isSafeInteger(x);
const isNonnegative=x=>Number.isFinite(x)&&x>=0;
const present=(o,shape)=>dataOnly(o)&&Object.entries(shape).every(([k,test])=>test(o[k]));
const opt=v=>present(v,{text:isStr,opIndex:isInteger});
const dialogOpt=v=>present(v,{index:isInteger,text:isStr});
const requiredItem=v=>present(v,{slot:isNum,id:isNum,name:isStr,count:isNum,
  optionsWithIndex:x=>Array.isArray(x)&&x.every(opt)});
const requiredNpc=v=>present(v,{kind:x=>x==='npc',id:isNum,index:isNum,name:isStr,
  combatLevel:isNum,x:isNum,z:isNum,distance:isNonnegative,
  hp:x=>x===null||isNum(x),maxHp:x=>x===null||isNum(x),
  healthPercent:x=>x===null||isNonnegative(x),targetIndex:isInteger,
  inCombat:isBool,lastCombatTick:x=>x===null||isInteger(x),
  animId:isInteger,spotanimId:isInteger,
  optionsWithIndex:x=>Array.isArray(x)&&x.every(opt),
  options:x=>Array.isArray(x)&&x.every(isStr)});
const requiredPlayer=v=>present(v,{kind:x=>x==='player',index:isNum,name:isStr,
  combatLevel:isNum,x:isNum,z:isNum,distance:isNonnegative});
const requiredLoc=v=>present(v,{id:isNum,name:isStr,x:isNum,z:isNum,level:isNum,
  distance:isNonnegative,optionsWithIndex:x=>Array.isArray(x)&&x.every(opt),
  options:x=>Array.isArray(x)&&x.every(isStr)});
const requiredGround=v=>present(v,{id:isNum,name:isStr,count:isNum,x:isNum,z:isNum,
  distance:isNonnegative});
const requiredPlayerState=v=>present(v,{name:isStr,combatLevel:isNum,hp:isNum,maxHp:isNum,
  x:isNum,z:isNum,worldX:isNum,worldZ:isNum,level:isNum,
  runEnergy:isNonnegative,runWeight:isNonnegative,animId:isInteger,spotanimId:isInteger,
  combat:c=>present(c,{inCombat:isBool,targetIndex:isInteger,
    targetType:x=>['npc','player','none'].includes(x),lastDamageTick:isInteger}),
  isDead:isBool,lifeId:isNum,respawnCount:isNum,
  lastDeathTick:x=>x===null||isInteger(x)});
const requiredDialog=d=>present(d,{isOpen:isBool,
  options:a=>Array.isArray(a)&&a.every(dialogOpt),isWaiting:isBool});
const requiredInterface=i=>present(i,{isOpen:isBool,interfaceId:isInteger,
  options:a=>Array.isArray(a)&&a.every(x=>present(x,{index:isInteger,text:isStr,componentId:isNum}))});
const shopItem=i=>present(i,{slot:isNum,id:isNum,name:isStr,count:isNum,
  baseCost:isNonnegative,buyPrice:isNonnegative,sellPrice:isNonnegative});
const requiredShop=s=>present(s,{isOpen:isBool,title:isStr,shopItems:a=>Array.isArray(a)&&a.every(shopItem),
  playerItems:a=>Array.isArray(a)&&a.every(shopItem)});
const bankItem=i=>present(i,{slot:isNum,id:isNum,name:isStr,count:isNum});
const requiredBank=b=>present(b,{isOpen:isBool,items:a=>Array.isArray(a)&&a.every(bankItem),noteMode:isBool});
const requiredPrayer=p=>present(p,{activePrayers:a=>Array.isArray(a)&&a.length===15&&a.every(isBool),
  prayerPoints:isNum,prayerLevel:isNum});
const chatMsg=m=>present(m,{type:isInteger,text:isStr,sender:isStr,tick:isNum,fromSelf:isBool});
const recentDialog=d=>present(d,{text:a=>Array.isArray(a)&&a.every(isStr),tick:isNum,interfaceId:isNum});
const combatEvent=e=>present(e,{tick:isNum,type:x=>['damage_taken','damage_dealt','kill'].includes(x),
  damage:isNum,sourceType:x=>['player','npc','other_player'].includes(x),sourceIndex:isInteger,
  targetType:x=>['player','npc','other_player'].includes(x),targetIndex:isInteger});
const metadata={contract:'MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb',
  semantics:'source-only typed conversion; no actual SDK gateway/real observer wired'};
export function toBotWorldState(raw,{botName,expectedWorld,approvedFamily=false}={}) {
  const s=validateObservation(raw,{botName,expectedWorld,approvedFamily});
  // Quest-stage varps are useful optional rev377 telemetry, NOT a required
  // BotWorldState field in the pinned upstream SDK types.ts contract. Do not
  // invent them; allowing the explicit native null does not omit a SDK field.
  const missingRequired=s.unsupported.filter(key=>key!=='questStages');
  if(missingRequired.length)missing(missingRequired.join(', '));
  const e=s.sdkDetails;
  for(const k of requiredExtra)if(e[k]===null||e[k]===undefined)missing('sdkDetails.'+k);
  if(!requiredPlayerState(e.player)||e.player.name!==s.player.username||
     e.player.x!==s.position.x||e.player.z!==s.position.z||
     e.player.worldX!==s.position.x||e.player.worldZ!==s.position.z||
     e.player.level!==s.position.plane)missing('consistent full PlayerState');
  if(!Array.isArray(s.inventory)||!s.inventory.every(requiredItem)||
     !Array.isArray(s.equipment)||!s.equipment.every(requiredItem))missing('inventory names/options');
  if(!s.nearbyNpcs.every(requiredNpc)||!s.nearbyLocs.every(requiredLoc)||
     !s.groundItems.every(requiredGround))missing('nearby entity SDK properties');
  if(!Array.isArray(e.nearbyPlayers)||!e.nearbyPlayers.every(requiredPlayer)||
     !Array.isArray(e.gameMessages)||!e.gameMessages.every(chatMsg)||
     !Array.isArray(e.recentDialogs)||!e.recentDialogs.every(recentDialog)||
     !Array.isArray(e.combatEvents)||!e.combatEvents.every(combatEvent)||
     !requiredPrayer(e.prayers)||!requiredInterface(e.interface)||
     !requiredShop(e.shop)||!requiredBank(e.bank))
       missing('complete verified SDK collection/interface properties');
  if(typeof e.modalOpen!=='boolean'||!isInteger(e.modalInterface))missing('modal information');
  if(!requiredDialog(s.dialogue))missing('verified dialogue properties');
  // SDK experience uses ordinary fractional XP. Native 377 stores XP in tenths.
  const skills=s.skills.map(v=>({name:v.name,level:v.level,baseLevel:v.baseLevel,
    experience:v.xpTenths/10}));
  const state={
    tick:s.tick,inGame:true,player:structuredClone(e.player),skills,
    inventory:structuredClone(s.inventory),equipment:structuredClone(s.equipment),
    nearbyNpcs:structuredClone(s.nearbyNpcs),nearbyPlayers:structuredClone(e.nearbyPlayers),
    nearbyLocs:structuredClone(s.nearbyLocs),groundItems:structuredClone(s.groundItems),
    gameMessages:structuredClone(e.gameMessages),recentDialogs:structuredClone(e.recentDialogs),
    dialog:structuredClone(s.dialogue),interface:structuredClone(e.interface),
    shop:structuredClone(e.shop),bank:structuredClone(e.bank),
    modalOpen:e.modalOpen,modalInterface:e.modalInterface,
    combatEvents:structuredClone(e.combatEvents),prayers:structuredClone(e.prayers)
  };
  return Object.freeze({state:structuredClone(state),source:{...metadata,instanceId:s.world.instanceId,sourceSha:s.world.sourceSha,
    tick:s.tick,evidence:'adapter mapping only; not proof of authoritative observation'}});
}
