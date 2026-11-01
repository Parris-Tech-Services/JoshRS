/**
 * Task 33: pure stateful lease for reconnect/backoff and duplicate-session
 * prevention. Does not touch sockets, other accounts or the running server.
 * All time is measured in normal 600ms server ticks; no busy reconnection.
 */
export function createSessionPolicy({botName='HarnessTest',worldId,initialBackoffTicks=2,maxAttempts=3}={}){
  if(!/^[A-Za-z0-9_ ]{1,12}$/.test(botName)||
    !/^isolated-[A-Za-z0-9_-]{4,64}$/.test(worldId??'')||
    !Number.isSafeInteger(initialBackoffTicks)||initialBackoffTicks<1||initialBackoffTicks>120||
    !Number.isSafeInteger(maxAttempts)||maxAttempts<1||maxAttempts>6)
    throw Error('Invalid bot session policy');
  let state='offline',attempts=0,lastTick=-1,nextRetryTick=0,stopped=false;
  const check=(tick,identity)=>{
    if(!Number.isSafeInteger(tick)||tick<lastTick||tick<0)throw Error('Stale or regressed tick');
    if(identity?.worldId!==worldId||identity?.botName!==botName)throw Error('World/player lease mismatch');
    lastTick=tick;
  };
  return Object.freeze({
    status:()=>({state,attempts,nextRetryTick,stopped,worldId,botName}),
    begin({tick,identity}={}){
      check(tick,identity);
      if(stopped)return {status:'blocked',reason:'operator_stopped'};
      if(state==='connecting'||state==='online')return {status:'blocked',reason:'duplicate_session'};
      if(attempts>=maxAttempts)return {status:'blocked',reason:'retry_budget_exhausted'};
      if(tick<nextRetryTick)return {status:'blocked',reason:'retry_backoff'};
      attempts++;state='connecting';
      return {status:'permitted',attempt:attempts};
    },
    authenticated({tick,identity}={}){
      check(tick,identity);
      if(state!=='connecting')return {status:'blocked',reason:'no_pending_login'};
      state='online';attempts=0;
      return {status:'online',botName,worldId};
    },
    disconnected({tick,identity}={}){
      check(tick,identity);
      if(stopped)return {status:'stopped'};
      if(state==='offline')return {status:'blocked',reason:'no_active_session'};
      state='offline';
      nextRetryTick=tick+initialBackoffTicks*(2**Math.max(0,attempts-1));
      return {status:'offline',nextRetryTick};
    },
    canDispatch({tick,identity}={}){
      check(tick,identity);
      return {allowed:!stopped&&state==='online',reason:stopped?'operator_stopped':
        state==='online'?'normal_bot_action':'session_not_online'};
    },
    stop(){
      stopped=true;state='stopped';
      return {status:'stopped',reconnectPermitted:false};
    }
  });
}
