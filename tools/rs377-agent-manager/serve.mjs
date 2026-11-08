#!/usr/bin/env node
/**
 * Windows local-only manager for disposable native revision-377 agents.
 * Does not start, replace or modify JoshRS engine or family saves.
 */
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {AgentFleet,validateProfile} from './fleet.mjs';
import {createLocalNativeAgentFactory} from './native377.mjs';

const repoRoot=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const port=Number(process.env.JOSHRS_AGENT_MANAGER_PORT||18886);
if(!Number.isInteger(port)||port<1024||port>65535||
   [52402,8888,43500,45099,15402,18880,18881].includes(port))
 throw new Error('Choose an unused loopback-only manager port');
const host='127.0.0.1';
const base='http://'+host+':'+port;
const csrf=randomBytes(32).toString('hex');
const home=join(repoRoot,'runtime','jparris-377','agent-manager');
const store=join(home,'profiles.json');
const fleet=new AgentFleet({
 adapterFactory:createLocalNativeAgentFactory({repoRoot})
});
await mkdir(home,{recursive:true,mode:0o700});
try{
 const profiles=JSON.parse(await readFile(store,'utf8'));
 if(!Array.isArray(profiles)||profiles.length>4)throw Error('invalid_profile_store');
 for(const profile of profiles)fleet.add(profile);
}catch(e){if(e.code!=='ENOENT')throw e}
async function saveProfiles(){
 const data=JSON.stringify(fleet.list().map(x=>({name:x.name,goal:x.goal})),null,2)+'\n';
 const temp=join(home,'profiles.'+randomBytes(6).toString('hex')+'.tmp');
 await writeFile(temp,data,{mode:0o600,flag:'wx'});
 await rename(temp,store);
}
const html=(await readFile(new URL('./public/index.html',import.meta.url),'utf8'))
 .replace('__CSRF__',csrf);
const client=await readFile(new URL('./public/app.js',import.meta.url),'utf8');
function respond(res,status,data){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','x-content-type-options':'nosniff'});
 res.end(JSON.stringify(data));
}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url??'/',base);
 if(req.headers.host!==host+':'+port){
  respond(res,403,{error:'loopback_host_only'});return;
 }
 if(req.method==='GET'&&url.pathname==='/'){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8',
   'cache-control':'no-store','content-security-policy':
    "default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'",
   'x-frame-options':'DENY','x-content-type-options':'nosniff'});
  res.end(html);return;
 }
 if(req.method==='GET'&&url.pathname==='/app.js'){
  res.writeHead(200,{'content-type':'text/javascript; charset=utf-8',
   'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(client);return;
 }
 if(req.method==='GET'&&url.pathname==='/api/status'){
  respond(res,200,{agents:fleet.list(),
   restrictions:{isolatedOnly:true,familyWorldEnabled:false,
    completeUpstreamBotWorldState:false,realQuesting:false}});return;
 }
 if(req.method!=='POST'||!url.pathname.startsWith('/api/')){
  respond(res,404,{error:'not_found'});return;
 }
 if(req.headers.origin!==base||req.headers['x-joshrs-csrf']!==csrf||
    req.headers['content-type']!=='application/json'){
  respond(res,403,{error:'same_origin_csrf_auth_required'});return;
 }
 try{
  let body='',size=0;
  for await(const chunk of req){
   size+=chunk.length;if(size>4096)throw new Error('request_too_large');
   body+=chunk.toString('utf8');
  }
  const data=JSON.parse(body);
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid_request');
  const action=url.pathname.slice(5);
  if(action==='create'){
   if(fleet.list().length>=4)throw Error('four_agent_profile_limit');
   fleet.add(validateProfile(data));await saveProfiles();
   respond(res,200,{created:true});return;
  }
  if(typeof data.name!=='string')throw Error('disposable_agent_name_required');
  if(action==='goal'){
   fleet.setGoal(data.name,data.goal);await saveProfiles();
   respond(res,200,{updated:true});return;
  }
  if(action==='start'){
   await fleet.start(data.name,data.password);
   respond(res,200,{started:true,gameplayVerified:false});return;
  }
  if(action==='pause'){respond(res,200,fleet.pause(data.name));return}
  if(action==='resume'){respond(res,200,fleet.resume(data.name));return}
  if(action==='stop'){respond(res,200,await fleet.stop(data.name));return}
  respond(res,404,{error:'unknown_action'});
 }catch(e){respond(res,400,{error:String(e?.message??e).slice(0,200)})}
});
server.listen(port,host,()=>{
 console.log('JoshRS local Agent Manager: '+base);
 console.log('Isolated Harness accounts only; no production/family world startup.');
});
async function shutdown(){
 server.close();
 for(const e of fleet.list()){
  if(e.phase!=='stopped')await fleet.stop(e.name);
 }
}
process.on('SIGINT',()=>{void shutdown().finally(()=>process.exit(0))});
process.on('SIGTERM',()=>{void shutdown().finally(()=>process.exit(0))});
