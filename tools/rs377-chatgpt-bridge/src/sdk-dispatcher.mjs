/**
 * Explicit, opt-in bridge from pinned RS-SDK BotAction to ordinary #377 TCP.
 * No fake state or auto-login: observer must supply authenticated native state.
 * Session.sendPacket only accepts allowlist-branded packets.
 */
import {mapSdkAction} from './sdk-bridge.mjs';
import {validateObservation} from './observation.mjs';

const fail=(code,message)=>Object.freeze({success:false,phase:'validation',reason:code,message});
export function createSdk377Dispatcher({session,observer,botName,expectedWorld,minTickGap=1}={}) {
  if(!session||typeof session.sendPacket!=='function'||typeof session.status!=='function')
    throw new TypeError('Real authenticated Session377 required');
  if(!observer||typeof observer.observe!=='function')
    throw new TypeError('Native 377 observation source required');
  if(!/^Harness[A-Za-z0-9_-]{1,10}$/.test(botName??'')||!/^isolated-[a-z0-9_-]{4,64}$/i.test(expectedWorld??''))
    throw new Error('Explicit disposable bot and isolated world required');
  if(session.identity!==botName||session.target?.mode!=='isolated')
    throw new Error('Session bot identity or isolated world mismatch');
  if(!Number.isInteger(minTickGap)||minTickGap<1||minTickGap>20)
    throw new RangeError('Invalid action tick bound');
  let stopped=false,inFlight=false,lastPacketTick=-Infinity;
  return Object.freeze({
    stop(){stopped=true;return {status:'stopped',effect:'unverified'};},
    async sendSdkAction(action) {
      if(stopped)return fail('stopped','Controller was stopped');
      if(inFlight)return fail('busy','Only one action may be dispatched at a time');
      inFlight=true;
      try{
        if(!session.status().authenticated)return fail('disconnected','No authenticated bot session');
        const raw=await observer.observe();
        const snapshot=validateObservation(raw,{botName,expectedWorld});
        if(snapshot.world.mode!=='isolated'||snapshot.world.revision!==377)
          return fail('wrong_world','Not an isolated revision-377 world');
        const mapped=mapSdkAction(action,snapshot);
        if(mapped.kind==='no_action'||mapped.kind==='wait') {
          return Object.freeze({success:true,phase:'routing',message:'No game packet dispatched',data:{kind:mapped.kind}});
        }
        if(mapped.kind!=='packet'||!mapped.packet)throw new Error('Unsafe mapping descriptor');
        if(snapshot.tick-lastPacketTick<minTickGap)
          return fail('rate_limit','Wait for a fresh observed game tick');
        // Only a buildAction() capability packet can cross Session377.sendPacket.
        const result=session.sendPacket(mapped.packet);
        lastPacketTick=snapshot.tick;
        return Object.freeze({
          success:result.status==='dispatched_unverified',
          phase:'dispatch',
          message:result.status==='dispatched_unverified'?
            'Packet written to bot session; game effect NOT observed':
            'Packet queued; game effect NOT observed',
          data:{transportStatus:result.status,observed:false,sourceTick:snapshot.tick}
        });
      }catch(error){
        const desc=String(error?.message??'unknown').slice(0,160);
        // Never include remote bytes, account secrets or arbitrary SDK input in output.
        const category=/disconnected|No authenticated/.test(desc)?'disconnected':'refused';
        return fail(category,category==='disconnected'?'Bot session unavailable':'Unverified or unsupported 377 action or observation');
      }finally{
        inFlight=false;
      }
    }
  });
}
