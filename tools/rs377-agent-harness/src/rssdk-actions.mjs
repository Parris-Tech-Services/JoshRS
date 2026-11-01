/**
 * Explicit 2026-10-29 RS-SDK BotAction to JoshRS Action377 translation.
 * Source: MaxBittker/rs-sdk@db0cc51, sdk/types.ts BotAction union.
 *
 * This is an allowlist, NOT a native packet encoder and NOT a live adapter.
 * The future transport must independently verify IDs and 377 game effects.
 */
import {validateAction} from './guard.mjs';
const REASON = 'joshrs-377-isolated-harness';
export function toRsSdkAction(raw) {
  const a=validateAction(raw);
  switch(a.type){
    case 'walk': return {type:'walkTo',x:a.x,z:a.z,running:false,reason:REASON};
    case 'npc_option': return {type:'interactNpc',npcIndex:a.npcIndex,optionIndex:a.option,reason:REASON};
    case 'loc_option': return {type:'interactLoc',x:a.x,z:a.z,locId:a.locId,optionIndex:a.option,reason:REASON};
    case 'ground_take': return {type:'pickupItem',x:a.x,z:a.z,itemId:a.itemId,reason:REASON};
    case 'inventory_option': return {type:'useInventoryItem',slot:a.slot,optionIndex:a.option,reason:REASON};
    case 'item_on_loc': return {type:'useItemOnLoc',itemSlot:a.slot,x:a.x,z:a.z,locId:a.locId,reason:REASON};
    case 'dialog_option': return {type:'clickDialogOption',optionIndex:a.option,reason:REASON};
    case 'wait': return {type:'wait',ticks:a.ticks,reason:REASON};
  }
  throw new Error('Unsupported action');
}
export function fromRsSdkAction(a){
  if(!a||typeof a!=='object')throw new Error('Invalid RS-SDK action');
  // The LLM must never choose an arbitrary SDK action with administrative or destructive effects.
  switch(a.type){
    case 'walkTo':return validateAction({type:'walk',x:a.x,z:a.z});
    case 'interactNpc':return validateAction({type:'npc_option',npcIndex:a.npcIndex,option:a.optionIndex});
    case 'interactLoc':return validateAction({type:'loc_option',x:a.x,z:a.z,locId:a.locId,option:a.optionIndex});
    case 'pickupItem':return validateAction({type:'ground_take',x:a.x,z:a.z,itemId:a.itemId});
    case 'useInventoryItem':return validateAction({type:'inventory_option',slot:a.slot,option:a.optionIndex});
    case 'useItemOnLoc':return validateAction({type:'item_on_loc',slot:a.itemSlot,x:a.x,z:a.z,locId:a.locId});
    case 'clickDialogOption':
      if(a.guard!==undefined)throw new Error('Guarded dialog needs verified page ID support');
      return validateAction({type:'dialog_option',option:a.optionIndex});
    case 'wait':return validateAction({type:'wait',ticks:a.ticks});
    default:throw new Error('Unsupported or privileged RS-SDK action');
  }
}
