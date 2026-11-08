/**
 * Authenticated, single-controller, loopback-only subset of the exact pinned
 * MaxBittker/rs-sdk@db0cc51e sdk/index.ts WebSocket message contract.
 *
 * Does NOT invent missing BotWorldState fields or announce action success
 * when only a packet write was observed. No automatic engine startup.
 */
import {createServer} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {verifyActionEffect} from './sdk-action-effects.mjs';

const safeEqual=(a,b)=>{
  if(typeof a!=='string'||typeof b!=='string')return false;
  const x=Buffer.from(a),y=Buffer.from(b);
  return x.length===y.length&&timingSafeEqual(x,y);
};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function createSdk377WebSocket({runtime,botName,token,host='127.0.0.1',
  maxPayload=8192,actionTimeoutMs=5500,stateIntervalMs=650}={}) {
  if(!runtime||typeof runtime.action!=='function'||typeof runtime.observe!=='function'||
     typeof runtime.getSdkState!=='function')throw new Error('real_sdk_runtime_required');
  if(typeof botName!=='string'||!/^Harness[A-Za-z0-9_-]{1,10}$/.test(botName))
    throw new Error('disposable_bot_required');
  if(typeof token!=='string'||Buffer.byteLength(token)<32)throw new Error('strong_sdk_auth_required');
  if(host!=='127.0.0.1'&&host!=='::1')throw new Error('loopback_only');
  if(!Number.isInteger(maxPayload)||maxPayload<512||maxPayload>65536)
    throw new Error('invalid_max_payload');
  if(!Number.isInteger(actionTimeoutMs)||actionTimeoutMs<1000||actionTimeoutMs>15000)
    throw new Error('invalid_action_timeout');
  if(!Number.isInteger(stateIntervalMs)||stateIntervalMs<100||stateIntervalMs>5000)
    throw new Error('invalid_state_interval');

  const server=createServer((req,res)=>{res.writeHead(404,{'cache-control':'no-store'});res.end()});
  const wsServer=new WebSocketServer({server,path:'/gateway',maxPayload,
    perMessageDeflate:false,clientTracking:true});
  let controller=null;
  const send=(ws,obj)=>{
    if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj));
  };
  wsServer.on('connection',(ws,req)=>{
    // Source may be a loopback TCP socket only. No remote, LAN, host or proxy.
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')){
      ws.close(1008,'loopback_only');return;
    }
    let authed=false,busy=false,closed=false,streamTimer=null,streamPending=null;
    let lastSentTick=-1,reportedIncomplete=false;
    const authDeadline=setTimeout(()=>{if(!authed)ws.close(1008,'auth_timeout')},5000);
    const stopStream=()=>{
      if(streamTimer!==null){clearInterval(streamTimer);streamTimer=null;}
    };
    ws.on('close',()=>{closed=true;clearTimeout(authDeadline);stopStream();if(controller===ws)controller=null});
    ws.on('error',()=>{closed=true;clearTimeout(authDeadline);stopStream()});
    // RS-SDK's BotSDK requires recurring sdk_state events, not just one
    // snapshot at connection. Every state MUST come from getSdkState() (which
    // validates the native observer), and must advance the real game tick.
    const streamState=()=>{
      if(closed||!authed||controller!==ws||busy||streamPending)return streamPending??Promise.resolve();
      streamPending=(async()=>{
        try{
          const observed=await runtime.getSdkState();
          if(closed||controller!==ws)return;
          const state=observed?.state;
          const required=['player','skills','inventory','equipment','nearbyNpcs',
            'nearbyPlayers','nearbyLocs','groundItems','gameMessages','recentDialogs',
            'dialog','interface','shop','bank','modalOpen','modalInterface',
            'combatEvents','prayers'];
          if(!state||state.inGame!==true||!Number.isSafeInteger(state.tick)||
             state.tick<0||observed?.source?.tick!==state.tick||
             observed?.source?.contract!=='MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb'||
             state.player?.name!==botName||!Array.isArray(state.skills)||
             state.skills.length!==21||required.some(key=>state[key]===null||state[key]===undefined))
            throw new Error('sdk_state_requires_grounded_tick_and_complete_contract');
          if(state.tick<=lastSentTick)return;
          const response={type:'sdk_state',state,stateReceivedAt:Date.now()};
          // Bounded output. No unverified or enormous state published to SDK.
          if(Buffer.byteLength(JSON.stringify(response))>262144)
            throw new Error('sdk_state_oversized');
          lastSentTick=state.tick;
          reportedIncomplete=false;
          if(!closed&&controller===ws)send(ws,response);
        }catch{
          // Never emit a fake SDK state. Warn once until a complete
          // authoritative state is available, then recover automatically.
          if(!reportedIncomplete&&!closed&&controller===ws){
            reportedIncomplete=true;
            send(ws,{type:'sdk_error',error:'authoritative_sdk_state_incomplete'});
          }
        }
      })().finally(()=>{streamPending=null});
      return streamPending;
    };
    ws.on('message',async (wire,isBinary)=>{
      if(closed)return;
      if(isBinary||wire.length>maxPayload){ws.close(1009,'size_limit');return}
      let msg;
      try{msg=JSON.parse(wire.toString('utf8'))}catch{ws.close(1007,'json_required');return}
      if(!msg||typeof msg!=='object'||Array.isArray(msg)){ws.close(1008,'object_required');return}
      if(!authed){
        if(msg.type!=='sdk_connect'||msg.username!==botName||
           !safeEqual(msg.password,token)||msg.mode!=='control'||
           typeof msg.clientId!=='string'||msg.clientId.length<1||msg.clientId.length>128) {
          ws.close(1008,'sdk_auth_failed');return;
        }
        if(controller&&controller.readyState===WebSocket.OPEN){
          send(ws,{type:'sdk_error',error:'another controller connected'});
          ws.close(1008,'single_controller');return;
        }
        authed=true;controller=ws;clearTimeout(authDeadline);
        send(ws,{type:'sdk_connected',success:true,maxMessageLength:78});
        // Start a recurring, monotonic native-state stream. A missing SDK
        // field is reported as an error, never invented or defaulted.
        await streamState();
        if(!closed&&controller===ws) {
          streamTimer=setInterval(()=>{void streamState()},stateIntervalMs);
          streamTimer.unref?.();
        }
        return;
      }
      if(controller!==ws){ws.close(1008,'lease_lost');return}
      if(msg.type==='sdk_action'){
        const actionId=msg.actionId;
        if(typeof actionId!=='string'||actionId.length<1||actionId.length>128||
           msg.username!==botName||!msg.action||typeof msg.action!=='object'){
          ws.close(1008,'invalid_sdk_action');return;
        }
        if(busy){send(ws,{type:'sdk_action_result',actionId,
          result:{success:false,message:'One pending action per controller',reason:'busy',phase:'validation'}});return}
        busy=true;
        try {
          // Never race the native observer reader against a fresh action.
          if(streamPending)await streamPending;
          if(closed||controller!==ws)return;
          const action=msg.action;
          // The native observer rejects duplicate samples in the same
          // 600ms tick. Do not re-read it immediately after taking the
          // before-state; wait for the actual next tick before dispatch.
          // Stream polling can have sampled this very same native 600ms tick.
          // Re-reading it is a legitimate replay refusal, NOT an action failure.
          // Only retry read-only observation; never blindly resend packets.
          let start;
          for(let attempts=0;attempts<4;attempts++){
            try{start=await runtime.observe();break}
            catch(error){
              if(!String(error?.message??'').includes('replayed_native_observation'))
                throw error;
              await sleep(650);
            }
          }
          if(!start)throw new Error('native_before_tick_unavailable');
          await sleep(675);
          if(closed||controller!==ws)return;
          let dispatch;
          for(let attempts=0;attempts<3;attempts++){
            try{
              dispatch=await runtime.action(action); // ordinary authenticated ISAAC packet
              break;
            }catch(error){
              // These errors are thrown before any packet is transmitted.
              // Do not retry a game action on ANY other error.
              if(!/replayed_native_observation|sdk_action_replay_or_stale_tick/.test(String(error?.message??'')))
                throw error;
              await sleep(650);
            }
          }
          if(!dispatch)throw new Error('native_action_tick_unavailable');
          if(dispatch.status==='observed_read_only'){
            // No game packet was sent; this was the bot's own authenticated
            // near-field observation. SDK scan methods expect result.data array.
            send(ws,{type:'sdk_action_result',actionId,result:{
              success:true,message:'Read native isolated bot view without mutation',
              phase:'completion',data:dispatch.data}});
            return;
          }
          if(dispatch.status==='no_action'){
            send(ws,{type:'sdk_action_result',actionId,result:{
              success:true,message:'No action requested',phase:'completion'}});
            return;
          }
          if(dispatch.status==='wait_requested'){
            const until=Date.now()+Math.min(15000,Math.max(actionTimeoutMs,dispatch.ticks*650+1200));
            let advanced=false;
            while(Date.now()<until&&!closed&&controller===ws){
              await sleep(650);
              let next;
              try{next=await runtime.observe()}
              catch(e){
                if(String(e?.message??'').includes('replayed_native_observation'))continue;
                throw e;
              }
              if(next.world?.instanceId!==start.world?.instanceId||
                 next.player?.username!==botName)throw new Error('native_world_changed_during_wait');
              if(next.tick>=dispatch.tick+dispatch.ticks){advanced=true;break}
            }
            send(ws,{type:'sdk_action_result',actionId,result:advanced?{
              success:true,message:'Native isolated game ticks advanced',
              phase:'completion',data:{verifiedEffect:false}
            }:{
              success:false,message:'Native wait not observed',
              phase:'observation',reason:'observation_timeout'
            }});
            return;
          }
          if(dispatch.status==='client_effect_observed'){
            // Local Java client independently returned a post-action status
            // from its game loop. Tab/design-randomization are client-local,
            // and must NEVER be interpreted as server quest/save progress.
            if(!dispatch.verifiedEffect||
               !['tab','randomize'].includes(dispatch.effect))
              throw new Error('unverified_native_java_client_effect');
            send(ws,{type:'sdk_action_result',actionId,result:{
              success:true,message:'Native Java 377 client UI effect observed',
              phase:'completion',data:{verifiedEffect:true,
                clientOnly:true,evidence:dispatch.effect}}});
            return;
          }
          if(dispatch.status==='client_packet_dispatched_unverified'){
            // Character design acceptance has two legs: a locally queued
            // normal 377 packet AND the authoritative engine changing the
            // saved appearance. Neither leg alone can establish completion.
            if(action.type!=='acceptCharacterDesign'||dispatch.effect!=='accept_design')
              throw new Error('unexpected_client_packet_dispatch');
            let verified=null;
            const until=Date.now()+actionTimeoutMs;
            while(Date.now()<until&&!closed&&ws===controller){
              await sleep(650);
              let after;
              try{after=await runtime.observe()}
              catch(e){
                if(String(e?.message??'').includes('replayed_native_observation'))continue;
                throw e;
              }
              verified=verifyActionEffect(action,start,after);
              if(verified)break;
            }
            send(ws,{type:'sdk_action_result',actionId,result:verified?{
              success:true,phase:'completion',
              message:'Actual native server confirmed character design',
              data:{verifiedEffect:true,evidence:verified.evidence}
            }:{
              success:false,phase:'observation',reason:'observation_timeout',
              message:'Java client queued design packet; native server effect not observed'
            }});
            return;
          }
          if(!['dispatched_unverified','queued_unverified'].includes(dispatch.status)){
            send(ws,{type:'sdk_action_result',actionId,result:{
              success:false,message:'No normal game packet dispatched',reason:'unsupported',phase:'validation'}});
            return;
          }
          // All actions other than an observed ordinary walk are unverified.
          // This does NOT grant XP, teleport, mutate saves or observe other users.
          let result={success:false,message:'Packet dispatched but game effect not verified',
            reason:'unverified',phase:'dispatch',
            data:{opcode:dispatch.opcode,sourceTick:dispatch.tick}};
          if(action.type==='walkTo'&&Number.isInteger(action.x)&&Number.isInteger(action.z)){
            const until=Date.now()+actionTimeoutMs;
            while(Date.now()<until&&!closed&&ws===controller){
              await sleep(650);
              let observed;
              try{observed=await runtime.observe()}
              catch(e){if(String(e.message).includes('replayed_native_observation'))continue;throw e}
              if(observed.tick<=start.tick)continue;
              if(observed.position?.x===action.x&&observed.position?.z===action.z){
                result={success:true,message:'Real isolated 377 world observed requested position',
                  phase:'completion',data:{startTick:start.tick,endTick:observed.tick,
                    world:observed.world.instanceId,verifiedEffect:true}};
                break;
              }
            }
            if(result.success===false)result={
              success:false,message:'Move dispatched; target position not observed',
              reason:'observation_timeout',phase:'observation'};
          }else{
            // All other actions require a real authoritative state delta.
            // A successful packet write is never a gameplay success. An
            // unauthenticated, missing or unchanged observation stays failure.
            const until=Date.now()+actionTimeoutMs;
            while(Date.now()<until&&!closed&&ws===controller){
              await sleep(650);
              let observed;
              try{observed=await runtime.observe()}
              catch(e){
                if(String(e?.message??'').includes('replayed_native_observation'))continue;
                throw e;
              }
              const verified=verifyActionEffect(action,start,observed);
              if(!verified)continue;
              result={success:true,message:'Native 377 game effect observed',
                phase:'completion',data:{startTick:start.tick,endTick:observed.tick,
                  world:observed.world.instanceId,
                  verifiedEffect:true,evidence:verified.evidence}};
              break;
            }
            if(result.success===false)result={
              success:false,message:'Normal packet dispatched but no grounded game effect observed',
              reason:'observation_timeout',phase:'observation'};
          }
          if(!closed&&ws===controller)send(ws,{type:'sdk_action_result',actionId,result});
        }catch{
          if(!closed&&ws===controller)send(ws,{type:'sdk_action_result',actionId,
            result:{success:false,message:'Native game observation or action rejected',
              reason:'refused',phase:'validation'}});
        }finally{busy=false}
        return;
      }
      send(ws,{type:'sdk_error',error:'unsupported_sdk_message'});
    });
  });
  return Object.freeze({
    async listen(port){
      // Port 0 is permitted for short-lived loopback-only tests; production
      // deployments must supply an explicit non-conflicting private port.
      if(!Number.isInteger(port)||(port!==0&&port<1024)||port>65535||
          [52402,8888,45099,43500,15402,18880,18881].includes(port))
        throw new Error('isolated_gateway_port_required');
      await new Promise((resolve,reject)=>{
        server.once('error',reject);
        server.listen(port,host,()=>{server.removeListener('error',reject);resolve()});
      });
      return {port:server.address().port,host,path:'/gateway'};
    },
    async close(){
      for(const client of wsServer.clients)client.terminate();
      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error('sdk_ws_server_close_timeout')),3000);
        wsServer.close(error=>{
          clearTimeout(timeout);
          if(error)reject(error);else resolve();
        });
      });
      await new Promise((resolve,reject)=>{
        if(!server.listening){resolve();return}
        // Short-lived upstream SDK HTTP health-check connections must not
        // keep the bridge's local listener alive after shutdown.
        server.closeIdleConnections?.();
        server.closeAllConnections?.();
        const timeout=setTimeout(()=>reject(new Error('sdk_http_server_close_timeout')),3000);
        server.close(err=>{
          clearTimeout(timeout);
          // Under Bun, wsServer.close() may already close the attached
          // HTTP server while server.listening is briefly still true.
          // Closing an already stopped server is successful idempotent cleanup.
          if(err&&err.code!=='ERR_SERVER_NOT_RUNNING')reject(err);
          else resolve();
        });
      });
    }
  });
}
