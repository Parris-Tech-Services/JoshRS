import {mapSdkAction,toBotWorldState} from './sdk-bridge.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

/**
 * Check whether an authoritative post-dispatch observation proves the
 * requested non-walk gameplay action took effect on a later server tick.
 */
export function verifyActionEffect(action,before,after){
 if(!before||!after||after.tick<=before.tick)return {verified:false,outcome:'pending_tick'};
 switch(action?.type){
  case 'none':
   return {verified:true,outcome:'no_action'};
  case 'wait':
   return after.tick>=before.tick+(action.ticks??1)
    ? {verified:true,outcome:'wait_completed'}
    : {verified:false,outcome:'waiting'};
  case 'walkTo':{
   const expectedPlane=before.position?.plane??0;
   if(!after.position)return {verified:false,outcome:'position_unavailable'};
   if(after.position.plane!==expectedPlane)return {verified:false,outcome:'wrong_plane',terminal:true};
   if(after.position.x===action.x&&after.position.z===action.z)
    return {verified:true,outcome:'destination_reached',terminal:true};
   if(after.position.x!==before.position?.x||after.position.z!==before.position?.z)
    return {verified:false,outcome:'movement_started'};
   return {verified:false,outcome:'no_movement_yet'};
  }
  case 'talkToNpc':
  case 'interactNpc':{
   const dialogOpened=after.dialogue?.isOpen===true&&
    (!before.dialogue?.isOpen||after.dialogue?.pageId!==before.dialogue?.pageId);
   const invChanged=JSON.stringify(after.inventory)!==JSON.stringify(before.inventory);
   const xpChanged=JSON.stringify(after.skills)!==JSON.stringify(before.skills);
   if(dialogOpened||invChanged||xpChanged)return {verified:true,outcome:'npc_interaction_verified'};
   return {verified:false,outcome:'awaiting_npc_response'};
  }
  case 'clickDialogOption':{
   const pageChanged=!after.dialogue?.isOpen||after.dialogue?.pageId!==before.dialogue?.pageId;
   const invChanged=JSON.stringify(after.inventory)!==JSON.stringify(before.inventory);
   const xpChanged=JSON.stringify(after.skills)!==JSON.stringify(before.skills);
   if(pageChanged||invChanged||xpChanged)return {verified:true,outcome:'dialogue_advanced'};
   return {verified:false,outcome:'dialogue_unchanged'};
  }
  case 'interactLoc':{
   const invChanged=JSON.stringify(after.inventory)!==JSON.stringify(before.inventory);
   const xpChanged=JSON.stringify(after.skills)!==JSON.stringify(before.skills);
   const locChanged=Array.isArray(before.nearbyLocs)&&Array.isArray(after.nearbyLocs)&&
    !after.nearbyLocs.some(l=>l.id===action.locId&&l.x===action.x&&l.z===action.z);
   const moved=after.position?.plane!==before.position?.plane||
    after.position?.x!==before.position?.x||after.position?.z!==before.position?.z;
   const dialogOpened=after.dialogue?.isOpen===true&&!before.dialogue?.isOpen;
   if(invChanged||xpChanged||locChanged||moved||dialogOpened)
    return {verified:true,outcome:'loc_interaction_verified'};
   return {verified:false,outcome:'awaiting_loc_effect'};
  }
  case 'useItemOnLoc':{
   const invChanged=JSON.stringify(after.inventory)!==JSON.stringify(before.inventory);
   const xpChanged=JSON.stringify(after.skills)!==JSON.stringify(before.skills);
   const dialogOpened=after.dialogue?.isOpen===true&&!before.dialogue?.isOpen;
   if(invChanged||xpChanged||dialogOpened)return {verified:true,outcome:'item_on_loc_verified'};
   return {verified:false,outcome:'awaiting_item_on_loc_effect'};
  }
  case 'pickupItem':
  case 'interactGroundItem':{
   const invChanged=JSON.stringify(after.inventory)!==JSON.stringify(before.inventory);
   const groundRemoved=Array.isArray(before.groundItems)&&Array.isArray(after.groundItems)&&
    before.groundItems.filter(g=>g.id===action.itemId&&g.x===action.x&&g.z===action.z).length>
    after.groundItems.filter(g=>g.id===action.itemId&&g.x===action.x&&g.z===action.z).length;
   if(invChanged||groundRemoved)return {verified:true,outcome:'ground_item_verified'};
   return {verified:false,outcome:'awaiting_ground_item_effect'};
  }
  case 'useInventoryItem':
  case 'dropItem':{
   const invChanged=JSON.stringify(after.inventory)!==JSON.stringify(before.inventory);
   const equipChanged=JSON.stringify(after.equipment)!==JSON.stringify(before.equipment);
   const xpChanged=JSON.stringify(after.skills)!==JSON.stringify(before.skills);
   if(invChanged||equipChanged||xpChanged)return {verified:true,outcome:'inventory_item_verified'};
   return {verified:false,outcome:'awaiting_inventory_effect'};
  }
  default:
   return {verified:false,outcome:'unsupported_action'};
 }
}

/**
 * Connect the pinned SDK's typed actions to the authenticated native 377 session.
 * No gateway, account selection, state fabrication or privileged commands.
 * Dispatch is not evidence that the game server performed an action.
 */
export function createSdk377Runtime({
 session,
 observer,
 botName,
 expectedWorld,
 maxActionsPerMinute=120
}={}){
 if(!session||typeof session.sendPacket!=='function'||typeof session.status!=='function')
  throw new Error('authenticated_native_session_required');
 if(!observer||typeof observer.observe!=='function')throw new Error('authoritative_observer_required');
 if(typeof botName!=='string'||!expectedWorld)throw new Error('explicit_bot_and_world_required');
 if(!Number.isInteger(maxActionsPerMinute)||maxActionsPerMinute<1||maxActionsPerMinute>600)
  throw new Error('invalid_action_rate_limit');

 let last=null;
 let lastActionTick=-1;
 let actionInFlight=false;
 const seenActionIds=new Set();
 const actionTimestamps=[];

 const checkRateAndReplay=(actionId)=>{
  if(actionId!==undefined){
   if(typeof actionId!=='string'||actionId.length<1||actionId.length>128)
    throw new Error('invalid_action_id');
   if(seenActionIds.has(actionId))
    throw new Error('sdk_action_replay_or_duplicate_id');
  }
  const now=Date.now();
  while(actionTimestamps.length>0&&now-actionTimestamps[0]>60_000)actionTimestamps.shift();
  if(actionTimestamps.length>=maxActionsPerMinute)
   throw new Error('sdk_action_rate_limit_exceeded');
 };

 const recordActionId=(actionId)=>{
  if(actionId!==undefined){
   seenActionIds.add(actionId);
   if(seenActionIds.size>1024){
    const oldest=seenActionIds.values().next().value;
    seenActionIds.delete(oldest);
   }
  }
  actionTimestamps.push(Date.now());
 };

 const observe=async()=>{
  const snapshot=await observer.observe();
  if(snapshot.player.username!==botName||snapshot.world.instanceId!==expectedWorld)
   throw new Error('sdk_observer_identity_or_world_changed');
  last=snapshot;
  return snapshot;
 };

 const dispatchInternal=async(action,{actionId,isCancelled}={})=>{
  checkRateAndReplay(actionId);
  if(typeof isCancelled==='function'&&isCancelled())throw new Error('sdk_action_cancelled');
  if(session.status().authenticated!==true)throw new Error('native_session_not_authenticated');
  const snapshot=await observe();
  if(typeof isCancelled==='function'&&isCancelled())throw new Error('sdk_action_cancelled');
  if(session.status().authenticated!==true)throw new Error('native_session_not_authenticated');
  const mapped=mapSdkAction(action,snapshot);
  if(mapped.kind==='no_action'){
   recordActionId(actionId);
   return {mapped,snapshot,response:Object.freeze({status:'no_action',tick:snapshot.tick,world:expectedWorld,verifiedEffect:true})};
  }
  if(mapped.kind==='wait'){
   recordActionId(actionId);
   return {mapped,snapshot,response:Object.freeze({status:'wait_requested',ticks:mapped.ticks,tick:snapshot.tick,world:expectedWorld,verifiedEffect:false})};
  }
  if(mapped.kind!=='packet')throw new Error('unsupported_mapped_action');
  if(snapshot.tick<=lastActionTick)throw new Error('sdk_action_replay_or_stale_tick');
  const sent=session.sendPacket(mapped.packet);
  if(!['queued_unverified','dispatched_unverified'].includes(sent.status))
   throw new Error('unknown_native_dispatch_result');
  lastActionTick=snapshot.tick;
  recordActionId(actionId);
  return {
   mapped,
   snapshot,
   response:Object.freeze({
    status:sent.status,
    opcode:mapped.packet.opcode,
    tick:snapshot.tick,
    world:expectedWorld,
    verifiedEffect:false
   })
  };
 };

 return Object.freeze({
  observe,
  async getSdkState(){
   const snapshot=await observe();
   return toBotWorldState(snapshot,{botName,expectedWorld});
  },
  async action(action,opts={}){
   if(actionInFlight)throw new Error('concurrent_sdk_action_refused');
   actionInFlight=true;
   try {
    const {response}=await dispatchInternal(action,opts);
    return response;
   } finally {
    actionInFlight=false;
   }
  },
  async executeVerifiedAction(action,{
   actionId,
   timeoutMs=6000,
   pollIntervalMs=650,
   maxStationaryWalkTicks=3,
   maxPartialBlockedTicks=2,
   isCancelled
  }={}){
   if(actionInFlight){
    return Object.freeze({
     status:'rejected',
     outcome:'concurrent_sdk_action_refused',
     verified:false,
     reason:'busy',
     message:'Concurrent SDK action refused while another action is in flight'
    });
   }
   actionInFlight=true;
   try {
    let dispatched;
    try {
     dispatched=await dispatchInternal(action,{actionId,isCancelled});
    } catch(err){
     return Object.freeze({
      status:'rejected',
      outcome:err.message,
      verified:false,
      reason:'refused',
      message:err.message
     });
    }
    const {mapped,snapshot:before,response}=dispatched;
    if(mapped.kind==='no_action'){
     return Object.freeze({
      status:'verified_success',
      outcome:'no_action',
      verified:true,
      startTick:before.tick,
      endTick:before.tick,
      world:expectedWorld,
      message:'No-op action completed'
     });
    }

    const deadline=Date.now()+timeoutMs;
    const expectedPlane=before.position?.plane??0;
    let prevTick=before.tick;
    let lastPos=before.position?{...before.position}:null;
    let movedAtLeastOnce=false;
    let stationaryTicks=0;
    let lastPhase='dispatched_unverified';

    while(Date.now()<deadline){
     if(typeof isCancelled==='function'&&isCancelled()){
      return Object.freeze({
       status:'verified_unsuccessful',
       outcome:'interrupted',
       verified:false,
       reason:'interrupted',
       opcode:response.opcode,
       startTick:before.tick,
       endTick:prevTick,
       world:expectedWorld,
       message:'Action interrupted by cancellation or controller disconnect'
      });
     }
     if(session.status().authenticated!==true){
      return Object.freeze({
       status:'verified_unsuccessful',
       outcome:'interrupted',
       verified:false,
       reason:'session_closed',
       opcode:response.opcode,
       startTick:before.tick,
       endTick:prevTick,
       world:expectedWorld,
       message:'Native session closed before action effect could be verified'
      });
     }
     if(pollIntervalMs>0)await sleep(pollIntervalMs);
     let after;
     try {
      after=await observe();
     } catch(err){
      if(String(err.message).includes('replayed_native_observation'))continue;
      throw err;
     }
     if(after.tick<=prevTick)continue;
     const tickDelta=after.tick-prevTick;
     prevTick=after.tick;

     if(action.type==='walkTo'){
      if(!after.position){
       return Object.freeze({
        status:'verified_unsuccessful',
        outcome:'position_unavailable',
        verified:false,
        reason:'position_unavailable',
        opcode:response.opcode,
        startTick:before.tick,
        endTick:after.tick,
        world:expectedWorld,
        message:'Position became unavailable during walk verification'
       });
      }
      if(after.position.plane!==expectedPlane){
       return Object.freeze({
        status:'verified_unsuccessful',
        outcome:'wrong_plane',
        verified:false,
        reason:'wrong_plane',
        opcode:response.opcode,
        startTick:before.tick,
        endTick:after.tick,
        position:after.position,
        world:expectedWorld,
        message:`Walk ended on plane ${after.position.plane} instead of expected plane ${expectedPlane}`
       });
      }
      if(after.position.x===action.x&&after.position.z===action.z){
       return Object.freeze({
        status:'verified_success',
        outcome:'destination_reached',
        verified:true,
        opcode:response.opcode,
        startTick:before.tick,
        endTick:after.tick,
        position:after.position,
        world:expectedWorld,
        message:`Verified arrival at (${action.x}, ${action.z}, plane ${expectedPlane})`
       });
      }
      if(lastPos&&(after.position.x!==lastPos.x||after.position.z!==lastPos.z)){
       movedAtLeastOnce=true;
       stationaryTicks=0;
       lastPos={...after.position};
       lastPhase='movement_started';
      } else {
       stationaryTicks+=tickDelta;
       if(movedAtLeastOnce&&stationaryTicks>=maxPartialBlockedTicks){
        return Object.freeze({
         status:'verified_unsuccessful',
         outcome:'partial_movement_blocked',
         verified:false,
         reason:'partial_movement_blocked',
         opcode:response.opcode,
         startTick:before.tick,
         endTick:after.tick,
         position:after.position,
         world:expectedWorld,
         message:`Movement stopped at (${after.position.x}, ${after.position.z}) before reaching (${action.x}, ${action.z})`
        });
       }
       if(!movedAtLeastOnce&&stationaryTicks>=maxStationaryWalkTicks){
        return Object.freeze({
         status:'verified_unsuccessful',
         outcome:'unreachable_or_blocked',
         verified:false,
         reason:'unreachable_or_blocked',
         opcode:response.opcode,
         startTick:before.tick,
         endTick:after.tick,
         position:after.position,
         world:expectedWorld,
         message:`No movement observed toward (${action.x}, ${action.z}) across ${stationaryTicks} server ticks`
        });
       }
      }
      continue;
     }

     const check=verifyActionEffect(action,before,after);
     lastPhase=check.outcome;
     if(check.verified){
      return Object.freeze({
       status:'verified_success',
       outcome:check.outcome,
       verified:true,
       opcode:response.opcode,
       startTick:before.tick,
       endTick:after.tick,
       snapshot:after,
       world:expectedWorld,
       message:`Verified ${action.type} effect (${check.outcome}) at tick ${after.tick}`
      });
     }
    }

    if(action.type==='walkTo'&&movedAtLeastOnce){
     return Object.freeze({
      status:'verified_unsuccessful',
      outcome:'partial_movement_blocked',
      verified:false,
      reason:'partial_movement_blocked',
      opcode:response.opcode,
      startTick:before.tick,
      endTick:prevTick,
      position:lastPos,
      world:expectedWorld,
      message:`Partial movement stopped at (${lastPos?.x}, ${lastPos?.z}) before reaching (${action.x}, ${action.z})`
     });
    }

    return Object.freeze({
     status:'timed_out',
     outcome:'observation_timeout',
     verified:false,
     reason:'observation_timeout',
     lastPhase,
     opcode:response.opcode,
     startTick:before.tick,
     endTick:prevTick,
     world:expectedWorld,
     message:`Timed out waiting for authoritative ${action.type} effect`
    });
   } finally {
    actionInFlight=false;
   }
  },
  isActionInFlight(){return actionInFlight},
  lastObservedTick(){return last?.tick??null}
 });
}
