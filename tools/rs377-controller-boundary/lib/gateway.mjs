import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {resolveTool,TOOL_SCHEMAS} from './controller.mjs';
const bytesEqual=(given,want)=>{
  if(typeof given!=='string')return false;
  const a=Buffer.from(given),b=Buffer.from(want);
  return a.length===b.length&&timingSafeEqual(a,b);
};
const json=(res,status,data)=>{
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));
};
/**
 * Actual HTTP boundary for a trusted disposable #377 transport (NOT upstream
 * RS-SDK wire protocol). Always loopback-bound, authenticated and no CORS.
 */
export function createLoopbackGateway(controller,{authToken,maxBodyBytes=4096}={}){
  if(typeof authToken!=='string'||Buffer.byteLength(authToken)<32)throw new Error('strong_gateway_token_required');
  if(!Number.isInteger(maxBodyBytes)||maxBodyBytes<256||maxBodyBytes>65536)throw new Error('invalid_body_limit');
  const server=http.createServer(async(req,res)=>{
    try{
      const remote=req.socket.remoteAddress;
      if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote))return json(res,403,{error:'loopback_only'});
      if(req.headers.origin || !/^((127\.0\.0\.1)|(localhost))(:\d+)?$/.test(req.headers.host||''))return json(res,403,{error:'untrusted_origin_or_host'});
      if(!bytesEqual(req.headers.authorization,`Bearer ${authToken}`))return json(res,401,{error:'unauthorised'});
      const url=new URL(req.url,'http://localhost');
      if(url.search || req.method!=='POST' || !['/claim','/renew','/observe','/act','/stop','/status','/goal','/step','/report','/tools'].includes(url.pathname))return json(res,404,{error:'unknown_route'});
      if(!(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{error:'json_only'});
      let size=0,buffers=[];
      for await(const chunk of req){size+=chunk.length;if(size>maxBodyBytes)return json(res,413,{error:'request_too_large'});buffers.push(chunk);}
      const body=JSON.parse(Buffer.concat(buffers).toString('utf8'));
      if(!body||typeof body!=='object'||Array.isArray(body))return json(res,400,{error:'invalid_json'});
      const lease=body.lease;
      let data;
      switch(url.pathname){
        case '/claim': data=await controller.claim();break;
        case '/renew': data=controller.renew(lease);break;
        case '/observe':data=await controller.observe();break;
        case '/status':data=controller.status();break;
        case '/tools':data=TOOL_SCHEMAS;break;
        case '/act':{
          const action=resolveTool(body.tool,body.args);
          data=await controller.run(lease,body.actionId,action,{timeoutMs:body.timeoutMs??1200});break;
        }
        case '/stop':data=controller.stop(lease);break;
        case '/goal':data=controller.proposeGoal(lease,body.goal,body.tick);break;
        case '/step':data=await controller.nextGoalStep(lease,body.tick,body.actionId);break;
        case '/report':controller.requireLease(lease);data=controller.ledger.get(body.actionId);break;
      }
      json(res,200,{ok:true,data});
    }catch(e){
      const msg=e?.message||'error';
      const bad=/^(lease_required|controller_busy|duplicate_session|replay_denied|action_in_flight|rate_limited|tick_rate_limited|forbidden_action|unsupported_tool|invalid_|untrusted_|journal_full|wrong_session)/.test(msg);
      json(res,bad?409:500,{ok:false,error:bad?msg:'internal_failure'});
    }
  });
  return {
    server,
    async start(){if(server.listening)throw new Error('already_listening');await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.off('error',reject);resolve();});});return {host:'127.0.0.1',port:server.address().port};},
    async close(){if(server.listening)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
  };
}
