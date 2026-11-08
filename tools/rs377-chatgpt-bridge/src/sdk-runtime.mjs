import {mapSdkAction,toBotWorldState} from './sdk-bridge.mjs';
/**
 * Connect the pinned SDK's typed actions to the authenticated native 377 session.
 * No gateway, account selection, state fabrication or privileged commands.
 * Dispatch is not evidence that the game server performed an action.
 */
export function createSdk377Runtime({session,observer,botName,expectedWorld}={}){
 if(!session||typeof session.sendPacket!=='function'||typeof session.status!=='function')
  throw new Error('authenticated_native_session_required');
 if(!observer||typeof observer.observe!=='function')throw new Error('authoritative_observer_required');
 if(typeof botName!=='string'||!expectedWorld)throw new Error('explicit_bot_and_world_required');
 let last=null;
 let lastActionTick=-1;
 let actionInFlight=false;
 const observe=async()=>{
  const snapshot=await observer.observe();
  if(snapshot.player.username!==botName||snapshot.world.instanceId!==expectedWorld)
   throw new Error('sdk_observer_identity_or_world_changed');
  last=snapshot;
  return snapshot;
 };
 return Object.freeze({
  observe,
  async getSdkState(){
   const snapshot=await observe();
   const mapped=toBotWorldState(snapshot,{botName,expectedWorld});
   // Authenticated own-character quest state; not part of upstream TS
   // schema. The unmodified BotSDK preserves additional sdk_state keys.
   const native=snapshot.questStages;
   if(native===null)return mapped;
   if(!native||typeof native!=='object'||Array.isArray(native)||
      Object.keys(native).length>111)throw new Error('invalid_native_quest_telemetry');
   const safe={};
   for(const [key,value] of Object.entries(native)){
     if(!/^[a-z0-9_]{1,48}$/.test(key))throw new Error('invalid_quest_varp_key');
     if(Number.isSafeInteger(value)&&value>=0){safe[key]=value}
     else if(value&&typeof value==='object'&&!Array.isArray(value)&&
       Object.keys(value).length<=8&&Object.entries(value).every(([k,v])=>
        /^[a-z0-9_]{1,48}$/.test(k)&&Number.isSafeInteger(v)&&v>=0)){
        safe[key]=structuredClone(value);
     }else throw new Error('invalid_quest_varp_value');
   }
   return Object.freeze({...mapped,
     state:Object.freeze({...mapped.state,joshrsQuestStages:Object.freeze(safe)})});
  },
  async action(action){
   if(actionInFlight)throw new Error('concurrent_sdk_action_refused');
   actionInFlight=true;
   try {
    if(session.status().authenticated!==true)throw new Error('native_session_not_authenticated');
    const snapshot=await observe();
    const mapped=mapSdkAction(action,snapshot);
    if(mapped.kind==='no_action')return Object.freeze({status:'no_action',tick:snapshot.tick});
    if(mapped.kind==='wait')return Object.freeze({status:'wait_requested',ticks:mapped.ticks,tick:snapshot.tick});
    if(mapped.kind==='read'){
     // The native observer already authenticated this bot/isolated world.
     // Scans are read-only and do not send any game packet.
     return Object.freeze({status:'observed_read_only',tick:snapshot.tick,
       world:expectedWorld,readType:mapped.readType,data:structuredClone(mapped.data),
       verifiedEffect:false});
    }
    if(mapped.kind!=='packet')throw new Error('unsupported_mapped_action');
    if(snapshot.tick<=lastActionTick)throw new Error('sdk_action_replay_or_stale_tick');
    const sent=session.sendPacket(mapped.packet);
    if(!['queued_unverified','dispatched_unverified'].includes(sent.status))
     throw new Error('unknown_native_dispatch_result');
    lastActionTick=snapshot.tick;
    return Object.freeze({status:sent.status,opcode:mapped.packet.opcode,tick:snapshot.tick,
     world:expectedWorld,verifiedEffect:false});
   } finally { actionInFlight=false; }
  },
  lastObservedTick(){return last?.tick??null}
 });
}
