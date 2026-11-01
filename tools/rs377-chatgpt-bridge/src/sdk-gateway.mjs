import {createServer} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
/**
 * Minimal local-only, authenticated gateway for the pinned SDK state/action
 * concepts. Not a replacement for upstream SDK's actual MCP transport.
 * Explicitly refuses full state until authoritative telemetry exists.
 */
export function createSdk377Gateway({runtime,token,host='127.0.0.1',maxBodyBytes=8192}={}){
 if(!runtime||typeof runtime.getSdkState!=='function'||typeof runtime.action!=='function')
  throw new Error('sdk_runtime_required');
 if(host!=='127.0.0.1'&&host!=='::1')throw new Error('gateway_must_bind_loopback');
 if(typeof token!=='string'||Buffer.byteLength(token)<32)throw new Error('gateway_token_required');
 if(!Number.isSafeInteger(maxBodyBytes)||maxBodyBytes<512||maxBodyBytes>65536)throw new Error('invalid_gateway_body_limit');
 const expected=Buffer.from('Bearer '+token);
 const server=createServer(async(req,res)=>{
  const reply=(status,body)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(body))};
  const auth=Buffer.from(req.headers.authorization??'');
  if(auth.length!==expected.length||!timingSafeEqual(auth,expected)){reply(401,{error:'unauthorized'});return}
  if(req.method==='GET'&&req.url==='/sdk_state'){
   try{const result=await runtime.getSdkState();reply(200,result)}
   catch{reply(409,{error:'authoritative_sdk_state_unavailable'})}
   return;
  }
  if(req.method==='POST'&&req.url==='/sdk_action'){
   let data='',size=0;
   try{
    for await(const chunk of req){
     size+=chunk.length;
     if(size>maxBodyBytes)throw new Error('oversized');
     data+=chunk.toString('utf8');
    }
    const body=JSON.parse(data);
    if(!body||typeof body!=='object'||Array.isArray(body)||
       Object.keys(body).some(k=>k!=='action')||!body.action)throw new Error('invalid');
    const result=await runtime.action(body.action);
    reply(200,result);
   }catch{reply(400,{error:'invalid_or_refused_sdk_action'})}
   return;
  }
  reply(404,{error:'not_found'});
 });
 return Object.freeze({server,listen:port=>new Promise((resolve,reject)=>{
  if(!Number.isInteger(port)||port<1024||port>65535||[8888,52402,45099,43500].includes(port))
   return reject(new Error('isolated_gateway_port_required'));
  server.once('error',reject);server.listen(port,host,()=>{server.removeListener('error',reject);resolve(server.address())});
 }),close:()=>new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()))});
}
