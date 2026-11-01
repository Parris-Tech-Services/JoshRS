import {action, snapshot, sameIdentity} from './guard.mjs';
const delay=(ms,signal)=>new Promise((resolve,reject)=>{
  if(signal?.aborted) return reject(new Error('cancelled'));
  const timer=setTimeout(()=>{cleanup();resolve();},ms);
  function abort(){cleanup();reject(new Error('cancelled'));}
  function cleanup(){clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  signal?.addEventListener('abort',abort,{once:true});
});
const quantity=(s,id)=>s.player.inventory.filter(i=>i.id===id).reduce((n,i)=>n+i.quantity,0);
const changed=(x,y)=>JSON.stringify(x)!==JSON.stringify(y);
/** Only action-relevant deltas count. Never report a bare dispatch as success. */
export function observedEffect(act,before,after){
  if(after.tick<=before.tick) return null;
  const b=before.player,a=after.player;
  switch(act.type){
    case 'walk': return (a.x!==b.x || a.z!==b.z) &&
      a.x===act.x && a.z===act.z && a.plane===b.plane?'destination_reached':null;
    case 'npc_option':case 'dialog_option': return changed(b.dialogue??null,a.dialogue??null)?'dialogue_changed':null;
    case 'ground_take': return quantity(after,act.itemId)>quantity(before,act.itemId)?'item_received':null;
    case 'loc_option':case 'item_on_loc':
      if(changed(b.dialogue??null,a.dialogue??null)) return 'dialogue_changed';
      if(changed(b.inventory,a.inventory)) return 'inventory_changed';
      if(changed(b.xp,a.xp)) return 'xp_changed';
      return null;
    case 'inventory_option':return changed(b.inventory,a.inventory)?'inventory_changed':null;
    case 'wait':return after.tick-before.tick>=act.ticks?'wait_elapsed':null;
    default:return null;
  }
}
/**
 * Separate dispatch, authenticated observation and result. Unknown transport outcome
 * is not automatically replayable. Required: transport.observe(), dispatch(action).
 */
export async function performObserved(transport,raw,{botName,worldId,timeoutMs=900,pollMs=50,signal,onDispatch}={}){
  if(!Number.isInteger(timeoutMs)||timeoutMs<0||timeoutMs>30000||!Number.isInteger(pollMs)||pollMs<1||pollMs>1000)throw new Error('invalid_timeout');
  let act;
  try{act=action(raw);}catch(e){return {status:'rejected',reason:e.message,dispatched:false};}
  if(signal?.aborted)return {status:'cancelled',dispatched:false};
  const before=snapshot(await transport.observe(),botName,worldId);
  if(signal?.aborted)return {status:'cancelled',dispatched:false};
  let reply;
  try{reply=await transport.dispatch(act,{signal});}
  catch(e){return {status:signal?.aborted?'cancelled':'unverified',reason:'dispatch_error_unknown',dispatched:'unknown'};}
  if(reply?.accepted!==true)return {status:'rejected',reason:'transport_rejected',dispatched:false};
  onDispatch?.({status:'sent',tick:before.tick});
  const deadline=Date.now()+timeoutMs;
  let last=before,progress=false;
  while(true){
    if(signal?.aborted)return {status:'cancelled',dispatched:true};
    let after;
    try{after=snapshot(await transport.observe(),botName,worldId);sameIdentity(before,after);}
    catch(e){return {status:'unverified',reason:'observation_error',dispatched:true};}
    const evidence=observedEffect(act,before,after);
    if(evidence)return {status:'observed',evidence,beforeTick:before.tick,afterTick:after.tick,dispatched:true};
    if(after.tick>before.tick)progress=true;
    last=after;
    if(Date.now()>=deadline)break;
    try{await delay(Math.min(pollMs,Math.max(1,deadline-Date.now())),signal);}catch{return {status:'cancelled',dispatched:true};}
  }
  return {status:progress?'unverified':'timeout',reason:progress?'no_matching_effect':'no_new_game_tick',dispatched:true,beforeTick:before.tick,afterTick:last.tick};
}
