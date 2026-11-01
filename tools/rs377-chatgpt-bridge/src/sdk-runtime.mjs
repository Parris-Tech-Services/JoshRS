import {buildAction} from './protocol.mjs';
import {mapSdkAction,toBotWorldState} from './sdk-bridge.mjs';
/**
 * Connect the pinned SDK's typed actions to the authenticated native 377 session.
 * No account selection, state fabrication or privileged commands.
 * Dispatch alone is never reported as verified gameplay success; verified
 * outcomes require an independently observed server state change on a later tick.
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function sameItems(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
  if (a.length !== b.length) return false;
  return a.every((item, idx) =>
    item.slot === b[idx]?.slot &&
    item.id === b[idx]?.id &&
    item.count === b[idx]?.count
  );
}

function skillsAdvanced(before, after) {
  if (!Array.isArray(before.skills) || !Array.isArray(after.skills)) return false;
  return after.skills.some((s, idx) => {
    const prev = before.skills[idx];
    return prev && (s.xpTenths > prev.xpTenths || s.level !== prev.level);
  });
}

function positionMoved(before, after) {
  if (!before.position || !after.position) return false;
  return (
    after.position.x !== before.position.x ||
    after.position.z !== before.position.z ||
    after.position.plane !== before.position.plane
  );
}

function dialogueChanged(before, after) {
  const bOpen = Boolean(before.dialogue?.isOpen);
  const aOpen = Boolean(after.dialogue?.isOpen);
  if (bOpen !== aOpen) return true;
  if (aOpen && after.dialogue?.pageId !== before.dialogue?.pageId) return true;
  return false;
}

function questsChanged(before, after) {
  return JSON.stringify(before.questStages ?? null) !== JSON.stringify(after.questStages ?? null);
}

function modalChanged(before, after) {
  return (
    before.sdkDetails?.modalOpen !== after.sdkDetails?.modalOpen ||
    before.sdkDetails?.modalInterface !== after.sdkDetails?.modalInterface
  );
}

function animChanged(before, after) {
  const bAnim = before.sdkDetails?.player?.animId ?? -1;
  const aAnim = after.sdkDetails?.player?.animId ?? -1;
  return aAnim !== -1 && aAnim !== bAnim;
}

export function verifyActionEffect(action, before, after) {
  if (!before || !after || after.tick <= before.tick) {
    return { verified: false, reason: 'tick_not_advanced' };
  }
  switch (action?.type) {
    case 'walkTo': {
      if (positionMoved(before, after)) {
        return {
          verified: true,
          message: `Walked from (${before.position.x}, ${before.position.z}) to (${after.position.x}, ${after.position.z})`,
          data: {
            from: { x: before.position.x, z: before.position.z, plane: before.position.plane },
            to: { x: after.position.x, z: after.position.z, plane: after.position.plane }
          }
        };
      }
      if (before.position && before.position.x === action.x && before.position.z === action.z) {
        return {
          verified: true,
          message: `Already at destination (${action.x}, ${action.z})`,
          data: {
            from: { x: before.position.x, z: before.position.z, plane: before.position.plane },
            to: { x: after.position.x, z: after.position.z, plane: after.position.plane }
          }
        };
      }
      return { verified: false, reason: 'position_unchanged' };
    }
    case 'talkToNpc':
    case 'interactNpc': {
      if (dialogueChanged(before, after) || animChanged(before, after) ||
          !sameItems(before.inventory, after.inventory) || skillsAdvanced(before, after) ||
          questsChanged(before, after) || modalChanged(before, after)) {
        return {
          verified: true,
          message: `Verified ${action.type} on NPC ${action.npcIndex} at tick ${after.tick}`,
          data: {
            npcIndex: action.npcIndex,
            dialogueOpen: Boolean(after.dialogue?.isOpen),
            pageId: after.dialogue?.pageId ?? null
          }
        };
      }
      return { verified: false, reason: 'npc_interaction_not_observed' };
    }
    case 'clickDialogOption': {
      if (dialogueChanged(before, after) || positionMoved(before, after) ||
          !sameItems(before.inventory, after.inventory) || questsChanged(before, after) ||
          modalChanged(before, after)) {
        return {
          verified: true,
          message: `Verified dialogue option ${action.optionIndex} transition at tick ${after.tick}`,
          data: {
            previousPageId: before.dialogue?.pageId ?? null,
            currentPageId: after.dialogue?.pageId ?? null,
            dialogueOpen: Boolean(after.dialogue?.isOpen)
          }
        };
      }
      return { verified: false, reason: 'dialogue_state_unchanged' };
    }
    case 'interactLoc':
    case 'useItemOnLoc': {
      const locChanged = Array.isArray(before.nearbyLocs) && Array.isArray(after.nearbyLocs) &&
        before.nearbyLocs.some(l => l.id === action.locId && l.x === action.x && l.z === action.z) &&
        !after.nearbyLocs.some(l => l.id === action.locId && l.x === action.x && l.z === action.z);
      const nonMoveEffect = locChanged || !sameItems(before.inventory, after.inventory) ||
        skillsAdvanced(before, after) || animChanged(before, after) ||
        dialogueChanged(before, after) || questsChanged(before, after) || modalChanged(before, after);
      const planeChanged = before.position && after.position && after.position.plane !== before.position.plane;
      if (nonMoveEffect || planeChanged) {
        return {
          verified: true,
          message: `Verified ${action.type} on loc ${action.locId} at (${action.x}, ${action.z})`,
          data: { locId: action.locId, x: action.x, z: action.z, locChanged, animId: after.sdkDetails?.player?.animId ?? -1 }
        };
      }
      return { verified: false, reason: 'loc_effect_not_observed' };
    }
    case 'pickupItem':
    case 'interactGroundItem': {
      const groundRemoved = Array.isArray(before.groundItems) && Array.isArray(after.groundItems) &&
        before.groundItems.some(g => g.id === action.itemId && g.x === action.x && g.z === action.z) &&
        !after.groundItems.some(g => g.id === action.itemId && g.x === action.x && g.z === action.z);
      if (groundRemoved || !sameItems(before.inventory, after.inventory)) {
        return {
          verified: true,
          message: `Verified ${action.type} for item ${action.itemId} at (${action.x}, ${action.z})`,
          data: { itemId: action.itemId, x: action.x, z: action.z, groundRemoved }
        };
      }
      return { verified: false, reason: 'ground_item_unchanged' };
    }
    case 'useInventoryItem':
    case 'dropItem': {
      if (!sameItems(before.inventory, after.inventory) || !sameItems(before.equipment, after.equipment) ||
          skillsAdvanced(before, after) || dialogueChanged(before, after) || modalChanged(before, after)) {
        return {
          verified: true,
          message: `Verified ${action.type} on slot ${action.slot}`,
          data: { slot: action.slot }
        };
      }
      return { verified: false, reason: 'inventory_state_unchanged' };
    }
    default:
      return { verified: false, reason: 'unverifiable_action_type' };
  }
}

export function createSdk377Runtime({session,observer,botName,expectedWorld}={}){
 if(!session||typeof session.sendPacket!=='function'||typeof session.status!=='function')
  throw new Error('authenticated_native_session_required');
 if(!observer||typeof observer.observe!=='function')throw new Error('authoritative_observer_required');
 if(typeof botName!=='string'||!expectedWorld)throw new Error('explicit_bot_and_world_required');
 let last=null;
 const observe=async()=>{
  const snapshot=await observer.observe();
  if(snapshot.player.username!==botName||snapshot.world.instanceId!==expectedWorld)
   throw new Error('sdk_observer_identity_or_world_changed');
  last=snapshot;
  return snapshot;
 };
 const executeVerifiedAction=async(action,{timeoutMs=8500,pollMs=120,maxWaitTicks=12}={})=>{
  if(session.status().authenticated!==true)throw new Error('native_session_not_authenticated');
  const before=await observe();
  let mapped;
  try{
   mapped=mapSdkAction(action,before);
  }catch(err){
   const msg=err instanceof Error?err.message:String(err);
   return Object.freeze({
    status:'rejected',
    verifiedEffect:false,
    tick:before.tick,
    observedTick:before.tick,
    world:expectedWorld,
    reason:msg,
    sdkResult:Object.freeze({
     success:false,
     message:msg,
     phase:'validation',
     reason:'rejected'
    })
   });
  }
  if(mapped.kind==='no_action'){
   return Object.freeze({
    status:'verified_success',
    verifiedEffect:true,
    tick:before.tick,
    observedTick:before.tick,
    world:expectedWorld,
    sdkResult:Object.freeze({
     success:true,
     message:'No action executed',
     phase:'completion'
    })
   });
  }
  if(mapped.kind==='wait'){
   const deadline=Date.now()+timeoutMs;
   let current=before;
   while(Date.now()<deadline){
    if(current.tick>=before.tick+mapped.ticks){
     return Object.freeze({
      status:'verified_success',
      verifiedEffect:true,
      ticks:mapped.ticks,
      tick:before.tick,
      observedTick:current.tick,
      world:expectedWorld,
      sdkResult:Object.freeze({
       success:true,
       message:`Waited ${mapped.ticks} tick(s) (tick ${before.tick} -> ${current.tick})`,
       phase:'completion'
      })
     });
    }
    await sleep(pollMs);
    current=await observe();
   }
   return Object.freeze({
    status:'timed_out',
    verifiedEffect:false,
    ticks:mapped.ticks,
    tick:before.tick,
    observedTick:current.tick,
    world:expectedWorld,
    reason:'wait_tick_timeout',
    sdkResult:Object.freeze({
     success:false,
     message:'Timed out waiting for server tick advance',
     phase:'observation',
     reason:'timeout'
    })
   });
  }
  if(mapped.kind!=='packet')throw new Error('unsupported_mapped_action');
  if((action?.type==='interactLoc'||action?.type==='useItemOnLoc') && before.position){
   let wx=action.x,wz=action.z;
   if(before.position.x<action.x)wx=action.x-1;
   else if(before.position.z<action.z)wz=action.z-1;
   else if(before.position.x>action.x)wx=action.x+1;
   else if(before.position.z>action.z)wz=action.z+1;
   session.sendPacket(buildAction({type:'op_walk',x:wx,z:wz,running:false}));
  }else if((action?.type==='pickupItem'||action?.type==='interactGroundItem') && before.position){
   session.sendPacket(buildAction({type:'op_walk',x:action.x,z:action.z,running:false}));
  }
  const sent=session.sendPacket(mapped.packet);
  if(!['queued_unverified','dispatched_unverified'].includes(sent.status))
   throw new Error('unknown_native_dispatch_result');

  const deadline=Date.now()+timeoutMs;
  let after=before;
  let lastReason='tick_not_advanced';
  while(Date.now()<deadline){
   await sleep(pollMs);
   after=await observe();
   if(after.tick<=before.tick)continue;
   const check=verifyActionEffect(action,before,after);
   if(check.verified){
    // For walkTo, if still moving toward target and within deadline, allow settling to destination
    if(action.type==='walkTo' && (after.position.x!==action.x || after.position.z!==action.z)){
     let prevPos={...after.position};
     let prevTick=after.tick;
     while(Date.now()<deadline && (after.position.x!==action.x || after.position.z!==action.z)){
      await sleep(pollMs);
      const next=await observe();
      if(next.tick>prevTick){
       after=next;
       if(after.position.x===prevPos.x && after.position.z===prevPos.z)break;
       prevPos={...after.position};
       prevTick=after.tick;
      }
     }
     const finalCheck=verifyActionEffect(action,before,after);
     return Object.freeze({
      status:'verified_success',
      opcode:mapped.packet.opcode,
      tick:before.tick,
      observedTick:after.tick,
      world:expectedWorld,
      verifiedEffect:true,
      sdkResult:Object.freeze({
       success:true,
       message:finalCheck.message,
       phase:'completion',
       data:finalCheck.data
      })
     });
    }
    return Object.freeze({
     status:'verified_success',
     opcode:mapped.packet.opcode,
     tick:before.tick,
     observedTick:after.tick,
     world:expectedWorld,
     verifiedEffect:true,
     sdkResult:Object.freeze({
      success:true,
      message:check.message,
      phase:'completion',
      data:check.data
     })
    });
   }
   lastReason=check.reason;
   if(after.tick>=before.tick+maxWaitTicks){
    return Object.freeze({
     status:'verified_unsuccessful',
     opcode:mapped.packet.opcode,
     tick:before.tick,
     observedTick:after.tick,
     world:expectedWorld,
     verifiedEffect:false,
     reason:lastReason,
     sdkResult:Object.freeze({
      success:false,
      message:`Action dispatched (opcode ${mapped.packet.opcode}) but no state change observed after ${after.tick-before.tick} ticks (${lastReason})`,
      phase:'observation',
      reason:lastReason
     })
    });
   }
  }
  const timedOutStatus=after.tick>before.tick?'verified_unsuccessful':'timed_out';
  return Object.freeze({
   status:timedOutStatus,
   opcode:mapped.packet.opcode,
   tick:before.tick,
   observedTick:after.tick,
   world:expectedWorld,
   verifiedEffect:false,
   reason:timedOutStatus==='timed_out'?'tick_advance_timeout':lastReason,
   sdkResult:Object.freeze({
    success:false,
    message:timedOutStatus==='timed_out'
     ?'Timed out waiting for server tick advance'
     :`Action did not produce expected effect before deadline (${lastReason})`,
    phase:'observation',
    reason:timedOutStatus==='timed_out'?'timeout':lastReason
   })
  });
 };
 return Object.freeze({
  observe,
  async getSdkState(){
   const snapshot=await observe();
   return toBotWorldState(snapshot,{botName,expectedWorld});
  },
  async action(action,options={}){
   if(options?.verifyEffect===true){
    return executeVerifiedAction(action,options);
   }
   if(session.status().authenticated!==true)throw new Error('native_session_not_authenticated');
   const snapshot=await observe();
   const mapped=mapSdkAction(action,snapshot);
   if(mapped.kind==='no_action')return Object.freeze({status:'no_action',tick:snapshot.tick});
   if(mapped.kind==='wait')return Object.freeze({status:'wait_requested',ticks:mapped.ticks,tick:snapshot.tick});
   if(mapped.kind!=='packet')throw new Error('unsupported_mapped_action');
   const sent=session.sendPacket(mapped.packet);
   if(!['queued_unverified','dispatched_unverified'].includes(sent.status))
    throw new Error('unknown_native_dispatch_result');
   return Object.freeze({status:sent.status,opcode:mapped.packet.opcode,tick:snapshot.tick,
    world:expectedWorld,verifiedEffect:false});
  },
  executeVerifiedAction,
  lastObservedTick(){return last?.tick??null}
 });
}
