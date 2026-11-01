import {createObserver} from './observation.mjs';
/**
 * Strict authenticated observer input over a supplied read-only message source.
 * No filesystem, shell, engine mutation, fake world state, or TCP game decoding.
 * A native 377 client/engine must emit its own real, bot-scoped observations.
 */
export function createNative377Observer(source,{botName,expectedWorld,token,maxBytes=32768}={}){
 if(!source||typeof source.read!=='function')throw new Error('native_read_source_required');
 if(typeof token!=='string'||Buffer.byteLength(token)<32)throw new Error('observer_authentication_required');
 if(!Number.isInteger(maxBytes)||maxBytes<1024||maxBytes>65536)throw new Error('invalid_observer_size');
 let sequence=-1;
 const readRaw=async()=>{
  const message=await source.read();
  if(!message||typeof message!=='object'||Array.isArray(message))throw new Error('invalid_native_message');
  if(Object.keys(message).some(k=>!['token','sequence','observation'].includes(k)))throw new Error('unexpected_native_fields');
  const a=Buffer.from(String(message.token??'')),b=Buffer.from(token);
  const {timingSafeEqual}=await import('node:crypto');
  if(a.length!==b.length||!timingSafeEqual(a,b))throw new Error('unauthenticated_native_observation');
  if(!Number.isSafeInteger(message.sequence)||message.sequence<=sequence)throw new Error('replayed_native_observation');
  if(Buffer.byteLength(JSON.stringify(message.observation))>maxBytes)throw new Error('oversized_native_observation');
  sequence=message.sequence;
  return message.observation;
 };
 return createObserver(readRaw,{botName,expectedWorld});
}
