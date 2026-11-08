import {createNative377Observer} from './native-observer.mjs';
/** Loopback-only reader for the opt-in engine-patch /dev/rs377-observe route. */
export function createEngine377Observer({port,token,botName,expectedWorld,fetchImpl=fetch}={}){
 if(!Number.isInteger(port)||port<1024||port>65535||[8888,52402,45099,43500].includes(port))throw new Error('isolated_management_port_required');
 if(typeof fetchImpl!=='function')throw new Error('fetch_required');
 if(typeof botName!=='string'||!/^Harness[A-Za-z0-9_-]{1,10}$/.test(botName))throw new Error('approved_isolated_bot_required');
 const url='http://127.0.0.1:'+port+'/dev/rs377-observe?bot='+encodeURIComponent(botName);
 const source={async read(){
  const response=await fetchImpl(url,{method:'GET',headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(3000)});
  if(!response.ok)throw new Error('native_observer_http_'+response.status);
  const raw=await response.text();
  if(Buffer.byteLength(raw)>65536)throw new Error('oversized_native_response');
  return JSON.parse(raw);
 }};
 return createNative377Observer(source,{botName,expectedWorld,token,maxBytes:32768});
}
