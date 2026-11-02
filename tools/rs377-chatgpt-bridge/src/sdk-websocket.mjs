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
import {verifyActionEffect} from './sdk-runtime.mjs';

const safeEqual=(a,b)=>{
  if(typeof a!=='string'||typeof b!=='string')return false;
  const x=Buffer.from(a),y=Buffer.from(b);
  return x.length===y.length&&timingSafeEqual(x,y);
};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function createSdk377WebSocket({runtime,botName,token,host='127.0.0.1',
  maxPayload=8192,actionTimeoutMs=5500,pollIntervalMs=650}={}) {
  if(!runtime||typeof runtime.action!=='function'||typeof runtime.observe!=='function'||
     typeof runtime.getSdkState!=='function')throw new Error('real_sdk_runtime_required');
  if(typeof botName!=='string'||!/^Harness[A-Za-z0-9_-]{1,10}$/.test(botName))
    throw new Error('disposable_bot_required');
  if(typeof token!=='string'||Buffer.byteLength(token)<32)throw new Error('strong_sdk_auth_required');
  if(host!=='127.0.0.1'&&host!=='::1')throw new Error('loopback_only');
  if(!Number.isInteger(maxPayload)||maxPayload<512||maxPayload>65536)
    throw new Error('invalid_max_payload');
  if(!Number.isInteger(actionTimeoutMs)||actionTimeoutMs<500||actionTimeoutMs>15000)
    throw new Error('invalid_action_timeout');
  if(!Number.isInteger(pollIntervalMs)||pollIntervalMs<10||pollIntervalMs>2000)
    throw new Error('invalid_poll_interval');

  const server=createServer((req,res)=>{res.writeHead(404,{'cache-control':'no-store'});res.end()});
  const wsServer=new WebSocketServer({server,path:'/gateway',maxPayload,
    perMessageDeflate:false,clientTracking:true});
  let controller=null;
  let globalBusy=false;
  const seenActionIds=new Set();
  const send=(ws,obj)=>{
    if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj));
  };
  wsServer.on('connection',(ws,req)=>{
    // Source may be a loopback TCP socket only. No remote, LAN, host or proxy.
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')){
      ws.close(1008,'loopback_only');return;
    }
    let authed=false,mode=null,busy=false,closed=false;
    const authDeadline=setTimeout(()=>{if(!authed)ws.close(1008,'auth_timeout')},5000);
    ws.on('close',()=>{closed=true;clearTimeout(authDeadline);if(controller===ws)controller=null});
    ws.on('error',()=>{closed=true;clearTimeout(authDeadline)});
    ws.on('message',async (wire,isBinary)=>{
      if(closed)return;
      if(isBinary||wire.length>maxPayload){ws.close(1009,'size_limit');return}
      let msg;
      try{msg=JSON.parse(wire.toString('utf8'))}catch{ws.close(1007,'json_required');return}
      if(!msg||typeof msg!=='object'||Array.isArray(msg)){ws.close(1008,'object_required');return}
      if(!authed){
        if(msg.type!=='sdk_connect'||msg.username!==botName||
           !safeEqual(msg.password,token)||
           (msg.mode!=='control'&&msg.mode!=='observe')||
           typeof msg.clientId!=='string'||msg.clientId.length<1||msg.clientId.length>128) {
          ws.close(1008,'sdk_auth_failed');return;
        }
        if(msg.mode==='control'){
          if(controller&&controller.readyState===WebSocket.OPEN){
            send(ws,{type:'sdk_error',error:'another controller connected'});
            ws.close(1008,'single_controller');return;
          }
          controller=ws;
        }
        authed=true;mode=msg.mode;clearTimeout(authDeadline);
        send(ws,{type:'sdk_connected',success:true,maxMessageLength:78});
        // Never send a fake sdk_state; until source fields are complete a real
        // upstream BotSDK cannot claim a complete BotWorldState.
        try {
          const state=await runtime.getSdkState();
          if(!closed)send(ws,{type:'sdk_state',state:state.state,stateReceivedAt:Date.now()});
        }catch {
          send(ws,{type:'sdk_error',error:'authoritative_sdk_state_incomplete'});
        }
        return;
      }
      if(msg.type==='sdk_action'){
        const actionId=msg.actionId;
        if(typeof actionId!=='string'||actionId.length<1||actionId.length>128||
           msg.username!==botName||!msg.action||typeof msg.action!=='object'||Array.isArray(msg.action)){
          ws.close(1008,'invalid_sdk_action');return;
        }
        if(mode==='observe'){
          send(ws,{type:'sdk_action_result',actionId,
            result:{success:false,message:'Observe-only client cannot dispatch actions',reason:'observe_only',phase:'validation'}});
          return;
        }
        if(controller!==ws){ws.close(1008,'lease_lost');return}
        if(seenActionIds.has(actionId)){
          send(ws,{type:'sdk_action_result',actionId,
            result:{success:false,message:'Duplicate or replayed actionId refused',reason:'replay',phase:'validation'}});
          return;
        }
        if(busy||globalBusy){send(ws,{type:'sdk_action_result',actionId,
          result:{success:false,message:'One pending action per controller',reason:'busy',phase:'validation'}});return}
        seenActionIds.add(actionId);
        if(seenActionIds.size>1024)seenActionIds.delete(seenActionIds.values().next().value);
        busy=true;globalBusy=true;
        try {
          const action=msg.action;
          // The native observer rejects duplicate samples in the same
          // 600ms tick. Wait for a fresh tick if the current tick was
          // already sampled during connection setup or prior observation.
          let start;
          for(let attempt=0;attempt<10;attempt++){
            try{start=await runtime.observe();break}
            catch(e){
              if(!String(e.message).includes('replayed_native_observation')||attempt===9)throw e;
              await sleep(Math.min(pollIntervalMs,180));
            }
          }
          await sleep(pollIntervalMs);
          if(closed||controller!==ws)return;
          let dispatch;
          for(let attempt=0;attempt<6;attempt++){
            try{dispatch=await runtime.action(action);break}
            catch(e){
              if(!String(e.message).includes('replayed_native_observation')||attempt===5)throw e;
              await sleep(Math.min(pollIntervalMs,180));
            }
          }
          if(dispatch.status==='no_action'){
            send(ws,{type:'sdk_action_result',actionId,result:{
              success:true,message:'No-op action verified',phase:'completion',
              data:{startTick:start.tick,endTick:dispatch.tick??start.tick,
                world:start.world?.instanceId,verifiedEffect:true}}});
            return;
          }
          if(!['dispatched_unverified','queued_unverified','wait_requested'].includes(dispatch.status)){
            send(ws,{type:'sdk_action_result',actionId,result:{
              success:false,message:'No normal game packet dispatched',reason:'unsupported',phase:'validation'}});
            return;
          }
          let result={success:false,message:'Packet dispatched but game effect not verified',
            reason:'unverified',phase:'dispatch',
            data:{opcode:dispatch.opcode,sourceTick:dispatch.tick}};
          const until=Date.now()+actionTimeoutMs;
          const expectedPlane=start.position?.plane??0;
          let prevTick=start.tick;
          let lastPos=start.position?{...start.position}:null;
          let movedAtLeastOnce=false;
          let stationaryTicks=0;

          while(Date.now()<until&&!closed&&ws===controller){
            await sleep(pollIntervalMs);
            let observed;
            try{observed=await runtime.observe()}
            catch(e){if(String(e.message).includes('replayed_native_observation'))continue;throw e}
            if(observed.tick<=prevTick)continue;
            const tickDelta=observed.tick-prevTick;
            prevTick=observed.tick;

            if(action.type==='walkTo'&&Number.isInteger(action.x)&&Number.isInteger(action.z)){
              const observedPlane=observed.position?.plane??0;
              if(observedPlane!==expectedPlane){
                result={success:false,message:'Walk ended on wrong plane',
                  reason:'wrong_plane',phase:'observation',
                  data:{startTick:start.tick,endTick:observed.tick,verifiedEffect:false}};
                break;
              }
              if(observed.position?.x===action.x&&observed.position?.z===action.z){
                result={success:true,message:'Real isolated 377 world observed requested position',
                  phase:'completion',data:{startTick:start.tick,endTick:observed.tick,
                    world:observed.world.instanceId,verifiedEffect:true}};
                break;
              }
              if(lastPos&&(observed.position?.x!==lastPos.x||observed.position?.z!==lastPos.z)){
                movedAtLeastOnce=true;
                stationaryTicks=0;
                lastPos={...observed.position};
              }else{
                stationaryTicks+=tickDelta;
                if(movedAtLeastOnce&&stationaryTicks>=2){
                  result={success:false,message:'Movement stopped before reaching target destination',
                    reason:'partial_movement_blocked',phase:'observation',
                    data:{startTick:start.tick,endTick:observed.tick,position:observed.position,verifiedEffect:false}};
                  break;
                }
                if(!movedAtLeastOnce&&stationaryTicks>=3){
                  result={success:false,message:'Destination unreachable or blocked',
                    reason:'unreachable_or_blocked',phase:'observation',
                    data:{startTick:start.tick,endTick:observed.tick,position:observed.position,verifiedEffect:false}};
                  break;
                }
              }
              continue;
            }

            const check=verifyActionEffect(action,start,observed);
            if(check.verified){
              result={success:true,message:`Verified ${action.type} effect (${check.outcome})`,
                phase:'completion',data:{startTick:start.tick,endTick:observed.tick,
                  world:observed.world?.instanceId,outcome:check.outcome,verifiedEffect:true}};
              break;
            }
          }
          if(result.success===false&&result.phase==='dispatch'){
            result=movedAtLeastOnce
              ? {success:false,message:'Movement stopped before reaching target destination',
                  reason:'partial_movement_blocked',phase:'observation'}
              : {success:false,message:'Action dispatched; target effect not observed',
                  reason:'observation_timeout',phase:'observation'};
          }
          if(!closed&&ws===controller)send(ws,{type:'sdk_action_result',actionId,result});
        }catch{
          if(!closed&&ws===controller)send(ws,{type:'sdk_action_result',actionId,
            result:{success:false,message:'Native game observation or action rejected',
              reason:'refused',phase:'validation'}});
        }finally{busy=false;globalBusy=false}
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
      await new Promise(resolve=>wsServer.close(()=>resolve()));
      await new Promise((resolve,reject)=>{
        if(!server.listening){resolve();return}
        server.close(err=>err?reject(err):resolve());
      });
    }
  });
}
