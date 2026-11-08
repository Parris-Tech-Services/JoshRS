#!/usr/bin/env node
/**
 * Real two-agent #377 integration, CI ONLY on an independent temporary world.
 * Never contact JParrisDesktop, Fedora, a public endpoint or a family account.
 * Normal native auth, two distinct network player sessions and ISAAC actions.
 * Assertions are grounded in native world snapshots and native save/relogin.
 * Run as an opt-in separate runner, never against the family's local game.
 */
import {readFile,stat} from 'node:fs/promises';
import {createPublicKey,randomBytes} from 'node:crypto';
import {Session377} from './src/session.mjs';
import {createEngine377Observer} from './src/engine-observer.mjs';
import {createSdk377Runtime} from './src/sdk-runtime.mjs';
import {createSdk377WebSocket} from './src/sdk-websocket.mjs';

const need=k=>{const x=process.env[k];if(!x)throw new Error('missing_ci_gate_'+k);return x};
const gamePort=Number(need('NODE_PORT')),webPort=Number(need('WEB_PORT'));
const managementPort=Number(need('WEB_MANAGEMENT_PORT'));
const token=need('RS377_OBSERVER_TOKEN'),expectedWorld=need('RS377_OBSERVER_WORLD');
if(process.env.RS377_LIVE_BOT_PROBE!=='true' ||
  process.env.RS377_OBSERVER_ENABLED!=='true' ||
  process.env.RS377_OBSERVER_ISOLATED!=='true' ||
  process.env.RS377_OBSERVER_BOTS!=='HarnessProbe,HarnessA,HarnessB' ||
  process.env.NODE_PROFILE!=='joshrs_ci_377' ||
  process.env.NODE_XPRATE!=='1' ||
  process.env.WEBSITE_REGISTRATION!=='false' ||
  gamePort!==15402||webPort!==18880||managementPort!==18881||
  expectedWorld!=='isolated-joshrs-ci-377'||
  process.env.RS377_OBSERVER_SOURCE_SHA!=='b5ac859b47915afb545e60e4c1208f25d43cb3fb')
  throw new Error('two_agents_isolated_ci_only');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const requireTrue=(v,reason)=>{if(!v)throw new Error('two_agent_acceptance_'+reason)};
const privatePem=await readFile('data/config/private.pem','utf8');
const publicKeyPem=createPublicKey(privatePem).export({format:'pem',type:'spki'});
const resp=await fetch('http://127.0.0.1:'+webPort+'/crc0',{signal:AbortSignal.timeout(3000)});
requireTrue(resp.ok,'missing_native_crc');
const crcBytes=Buffer.from(await resp.arrayBuffer());
requireTrue(crcBytes.length===40,'invalid_native_crc');
const crcs=crcBytes.subarray(0,36);
const names=['HarnessA','HarnessB'];
const entries=names.map((name,i)=>{
 // Revision 377 normal RSA login allows at most 20 password characters.
 const password=randomBytes(15).toString('base64url');
 return {
  name,password,session:new Session377({
   target:{host:'127.0.0.1',port:gamePort,mode:'isolated'},
   username:name,password,publicKeyPem,crcs,timeoutMs:9000
  }),
  observer:createEngine377Observer({port:managementPort,token,botName:name,expectedWorld}),
  port:18884+i,
  socket:null,gateway:null,position:null,lastObserved:null
 };
});
const readNext=async entry=>{
 for(let i=0;i<14;i++){
  await sleep(650);
  try{
   const snap=await entry.observer.observe();
   entry.lastObserved=snap;
   if(snap.position)return snap;
  }catch(e){
   if(/native_observer_http_409|replayed_native_observation/.test(e.message))continue;
   throw e;
  }
 }
 throw new Error('bot_not_observed_'+entry.name);
};
const wireMessages=new WeakMap();
async function nextReply(entry,pred,timeout=8000) {
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){
  const match=wireMessages.get(entry.socket)?.find(pred);
  if(match)return match;
  await sleep(40);
 }
 throw new Error('missing_sdk_envelope_'+entry.name);
}
async function moveNormal(entry){
 const before=(await readNext(entry)).position;
 const candidates=[[before.x+1,before.z],[before.x,before.z+1],
  [before.x-1,before.z],[before.x,before.z-1]];
 for(let i=0;i<candidates.length;i++){
  const [x,z]=candidates[i];
  const actionId='two-'+entry.name+'-'+i;
  entry.socket.send(JSON.stringify({type:'sdk_action',
   username:entry.name,actionId,
   action:{type:'walkTo',x,z,running:false,reason:'real two-network-agent CI acceptance'}}));
  const response=await nextReply(entry,m=>m.type==='sdk_action_result'&&m.actionId===actionId,10000);
  if(response.result?.success===true&&response.result?.phase==='completion'&&
     response.result?.data?.verifiedEffect===true){
    const actual=await readNext(entry);
    requireTrue(actual.position.x===x&&actual.position.z===z,
      'claimed_unobserved_movement_'+entry.name);
    entry.position={...actual.position};
    return;
  }
  await sleep(700);
 }
 throw new Error('no_real_walk_'+entry.name);
}
try{
 for(const entry of entries){
  const auth=await entry.session.connect();
  requireTrue(auth.authenticated,'login_'+entry.name);
 }
 for(const entry of entries){
  const snap=await readNext(entry);
  requireTrue(snap.world.instanceId===expectedWorld&&snap.player.username===entry.name,
    'wrong_observed_identity_'+entry.name);
  requireTrue(Array.isArray(snap.nearbyLocs)&&Array.isArray(snap.groundItems)&&
    Array.isArray(snap.nearbyPlayers),'missing_native_world_arrays_'+entry.name);
 }
 // Native RS renderer decides actual visibility. This proves each sees the
 // other when spawned within the normal 16-tile visible viewport.
 let mutualVisible=false;
 for(let i=0;i<12;i++){
  const a=await readNext(entries[0]),b=await readNext(entries[1]);
  const visible=(snapshot,name)=>snapshot.nearbyPlayers.some(p=>
   p.name.replace(/[^a-z0-9]/gi,'').toLowerCase()===name.toLowerCase());
  if(visible(a,entries[1].name)&&visible(b,entries[0].name)){
   mutualVisible=true;break;
  }
 }
 requireTrue(mutualVisible,'ordinary_network_players_not_mutually_visible');
 // Two separate authenticated WebSocket controller leases, both attached to
 // different legitimate ISAAC TCP player sessions in the SAME real world.
 for(const entry of entries){
  entry.gatewayToken=randomBytes(32).toString('hex');
  const runtime=createSdk377Runtime({
   session:entry.session,
   observer:createEngine377Observer({port:managementPort,token,botName:entry.name,expectedWorld}),
   botName:entry.name,expectedWorld
  });
  entry.gateway=createSdk377WebSocket({runtime,botName:entry.name,token:entry.gatewayToken});
  await entry.gateway.listen(entry.port);
  const sock=new WebSocket('ws://127.0.0.1:'+entry.port+'/gateway');
  entry.socket=sock;
  const replies=[];
  wireMessages.set(sock,replies);
  sock.addEventListener('message',e=>{try{replies.push(JSON.parse(e.data))}catch{}});
  await new Promise((resolve,reject)=>{
   const deadline=setTimeout(()=>reject(new Error('ws_open_timeout')),3000);
   sock.addEventListener('open',()=>{clearTimeout(deadline);resolve()},{once:true});
   sock.addEventListener('error',()=>{clearTimeout(deadline);reject(new Error('ws_failed'))},{once:true});
  });
  sock.send(JSON.stringify({type:'sdk_connect',username:entry.name,
   password:entry.gatewayToken,clientId:'isolated-dual-'+entry.name,mode:'control'}));
  await nextReply(entry,x=>x.type==='sdk_connected'&&x.success===true);
  await nextReply(entry,x=>x.type==='sdk_error'&&x.error==='authoritative_sdk_state_incomplete');
 }
 // Both controls are active concurrently; no direct Player mutations.
 for(const entry of entries)await moveNormal(entry);
 for(const entry of entries){
  entry.socket.close();
  await entry.gateway.close();
  entry.gateway=null;
  entry.session.close();
 }
 // The server, not the test, must write two independent native CRC saves.
 for(const entry of entries){
  let wrote=false;
  for(let i=0;i<105;i++){
   await sleep(700);
   try{
    const f=await stat('data/players/joshrs_ci_377/'+entry.name.toLowerCase()+'.sav');
    if(f.size>8){wrote=true;break}
   }catch(e){if(e.code!=='ENOENT')throw e}
  }
  requireTrue(wrote,'native_save_not_written_'+entry.name);
 }
 // Reauthentication with the SAME distinct bot account and original password
 // must restore the position that the authenticated action produced.
 for(const entry of entries){
  let recovered=null;
  for(let i=0;i<12;i++){
   const relog=new Session377({
    target:{host:'127.0.0.1',port:gamePort,mode:'isolated'},
    username:entry.name,password:entry.password,publicKeyPem,crcs,timeoutMs:4500
   });
   try{
    await relog.connect();recovered=relog;break;
   }catch{relog.close();await sleep(650)}
  }
  requireTrue(recovered,'relog_'+entry.name);
  try{
   const obs=createEngine377Observer({port:managementPort,token,
    botName:entry.name,expectedWorld});
   let saved=null;
   for(let i=0;i<12;i++){
    await sleep(675);
    try{saved=await obs.observe();break}
    catch(e){if(/native_observer_http_409|replayed_native_observation/.test(e.message))continue;throw e}
   }
   requireTrue(saved?.position?.x===entry.position.x &&
     saved?.position?.z===entry.position.z &&
     saved?.position?.plane===entry.position.plane,'saved_coordinates_'+entry.name);
  }finally{recovered.close()}
 }
 console.log(JSON.stringify({
  verified:'TWO_SEPARATE_REAL_377_SDK_WIRE_CONTROLLERS',
  world:expectedWorld,normalTcpAccounts:2,mutualNativeVisibility:true,
  uniqueControllerLeases:2,observedWalks:2,nativeSaveRelogs:2,
  nativeZoneArraysVerified:true,fullUpstreamBotWorldState:false,
  realQuestComplete:false,familyWorldTouched:false
 }));
}finally{
 for(const entry of entries){
  try{entry.socket?.close()}catch{}
  try{await entry.gateway?.close()}catch{}
  try{entry.session.close()}catch{}
 }
}
