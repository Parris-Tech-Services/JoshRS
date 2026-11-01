#!/usr/bin/env node
/**
 * CI-ONLY: prove genuine bot observation using an actual disposable LostCity
 * revision-377 server, not fixture objects or fabricated SDK state.
 *
 * Invoked by smoke_377.py only when RS377_LIVE_BOT_PROBE=true, after the
 * isolated packed server has started. No production accounts, live family
 * runtime, or preserved saves are used. Never print credentials or private key.
 */
import {readFile} from 'node:fs/promises';
import {createPublicKey,randomBytes} from 'node:crypto';
import {Session377} from './src/session.mjs';
import {createEngine377Observer} from './src/engine-observer.mjs';
import {SKILLS377} from './src/observation.mjs';
import {createSdk377Runtime} from './src/sdk-runtime.mjs';
import {createSdk377Gateway} from './src/sdk-gateway.mjs';
import {verifyRealEngineGateway} from '../rs377-controller-boundary/test/real-engine-security.acceptance.mjs';

const required=(name)=>{
  const value=process.env[name];
  if(!value)throw new Error('Missing isolated CI variable '+name);
  return value;
};
const reject=reason=>{throw new Error('Genuine 377 observer acceptance: '+reason)};
const gamePort=Number(required('NODE_PORT'));
const webPort=Number(required('WEB_PORT'));
const managementPort=Number(required('WEB_MANAGEMENT_PORT'));
const token=required('RS377_OBSERVER_TOKEN');
const expectedWorld=required('RS377_OBSERVER_WORLD');
const username=required('RS377_OBSERVER_BOT');
const serverSourceSha=required('RS377_OBSERVER_SOURCE_SHA');
if(process.env.RS377_OBSERVER_ENABLED!=='true'||process.env.RS377_OBSERVER_ISOLATED!=='true'||
   process.env.RS377_LIVE_BOT_PROBE!=='true'||process.env.NODE_XPRATE!=='1'||
   process.env.NODE_PROFILE!=='joshrs_ci_377'||process.env.WEBSITE_REGISTRATION!=='false'||
   gamePort!==15402||webPort!==18880||managementPort!==18881||
   expectedWorld!=='isolated-joshrs-ci-377'||username!=='HarnessProbe'||
   serverSourceSha!=='b5ac859b47915afb545e60e4c1208f25d43cb3fb')
  reject('runner does not match approved isolated CI engine; refusing to connect');

const privatePem=await readFile('data/config/private.pem','utf8');
// Local extraction of the public key only; NEVER print, transmit or save private PEM.
const publicKeyPem=createPublicKey(privatePem).export({format:'pem',type:'spki'});
const crcResponse=await fetch('http://127.0.0.1:'+webPort+'/crc0',{redirect:'error',signal:AbortSignal.timeout(3000)});
if(!crcResponse.ok)reject('cache CRC request failed');
const crcAndHash=Buffer.from(await crcResponse.arrayBuffer());
// Engine-TS CrcBuffer has 9 x uint32 cache CRCs followed by the
// separate uint32 rolling cache hash (40 bytes total); login transmits
// ONLY the first 36 bytes. Never invent or hardcode checksum values.
if(crcAndHash.length!==40)reject('server did not return the 40-byte real CRC table');
const crcs=Buffer.from(crcAndHash.subarray(0,36));

const password=randomBytes(18).toString('base64url').slice(0,20);
const session=new Session377({
 target:{host:'127.0.0.1',port:gamePort,mode:'isolated'},
 username,password,publicKeyPem,crcs,timeoutMs:9000
});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try {
 const login=await session.connect();
 if(!login.authenticated||!session.status().authenticated)reject('normal TCP account authentication failed');
 const reader=createEngine377Observer({
   port:managementPort,token,botName:username,expectedWorld
 });
 let first;
 const end=Date.now()+8000;
 while(Date.now()<end){
   try {first=await reader.observe();break}
   catch(error){
     if(error.message.includes('native_observer_http_409') || error.message.includes('replayed_native_observation')) {
       await delay(650);continue;
     }
     throw error;
   }
 }
 if(!first)reject('connected disposable bot never appeared in real engine observer');
 if(first.player.username!==username||first.world.instanceId!==expectedWorld)
   reject('wrong bot/world observation');
 if(!first.position||!Number.isInteger(first.position.x)||!Number.isInteger(first.position.z))
   reject('no real player coordinates');
 if(!Array.isArray(first.skills)||first.skills.length!==21||
   !first.skills.every((skill,i)=>skill.name===SKILLS377[i]&&
      Number.isInteger(skill.xpTenths)&&skill.xpTenths>=0&&
      Number.isInteger(skill.level)&&Number.isInteger(skill.baseLevel)))
   reject('real native skill arrays missing or inconsistent');
 if(!Array.isArray(first.inventory)||!Array.isArray(first.equipment))
   reject('real inventory/equipment arrays not exposed');
 if(!Array.isArray(first.nearbyNpcs)||
   !first.nearbyNpcs.every(n=>Number.isInteger(n.index)&&Number.isInteger(n.id)&&
     Number.isInteger(n.x)&&Number.isInteger(n.z)))
   reject('real rsbuf-visible NPC list unavailable');
 if(!first.dialogue||typeof first.dialogue.isOpen!=='boolean'||
   typeof first.dialogue.isWaiting!=='boolean'||
   !Array.isArray(first.dialogue.pendingComponentIds)||
   first.dialogue.optionTextAvailable!==false)
   reject('real server-owned dialogue state unavailable');
 let later;
 for(let i=0;i<8;i++) {
   await delay(675);
   try {later=await reader.observe();if(later.tick>first.tick)break}
   catch(error){if(error.message.includes('replayed_native_observation'))continue;throw error}
 }
 if(!later||later.tick<=first.tick)reject('actual server ticks did not advance');
 // Task 26: use the very same already-authenticated REAL #377 TCP client.
 // The boundary verifies security through the real engine observer and real
 // ISAAC-wrapped normal walk; it does not replace or restart the game.
 const task26=await verifyRealEngineGateway({
   session,managementPort,token,botName:username,worldId:expectedWorld
 });
 if(task26.checks.length!==10||!task26.packetDispatched)
   reject('real engine boundary gateway security checks incomplete');
 // Task 26 may have moved this ordinary player. Refresh the SDK baseline so
 // subsequent SDK success can only count movement occurring AFTER its own action.
 const sdkAnchor=await reader.observe();

 // Execute a GENUINE SDK BotAction via the authenticated local gateway. The
 // gateway uses actual engine observations, the rev377 packet encoder and
 // ISAAC-protected TCP. Action success requires an observed position delta.
 let moved=null, dispatchAttemptCount=0;
 const gatewayToken=randomBytes(32).toString('hex');
 const runtimeObserver=createEngine377Observer({port:managementPort,token,
   botName:username,expectedWorld});
 const runtime=createSdk377Runtime({
   session,observer:runtimeObserver,botName:username,expectedWorld
 });
 const gateway=createSdk377Gateway({runtime,token:gatewayToken});
 const gatewayPort=18882;
 const auth={authorization:'Bearer '+gatewayToken};
 try {
   await gateway.listen(gatewayPort);
   // A complete SDK BotWorldState is not supported yet. Verify we get a
   // real fail-closed 409 rather than a fabricated state.
   const stateResponse=await fetch('http://127.0.0.1:'+gatewayPort+'/sdk_state',
     {headers:auth,signal:AbortSignal.timeout(3000)});
   if(stateResponse.status!==409)reject('incomplete SDK state was incorrectly advertised');
   const candidates=[
     [sdkAnchor.position.x+1,sdkAnchor.position.z],
     [sdkAnchor.position.x,sdkAnchor.position.z+1],
     [sdkAnchor.position.x-1,sdkAnchor.position.z],
     [sdkAnchor.position.x,sdkAnchor.position.z-1]
   ];
   for(const [x,z] of candidates) {
     await delay(750); // engine sequence advances at 600ms
     const actionResponse=await fetch('http://127.0.0.1:'+gatewayPort+'/sdk_action',{
       method:'POST',headers:{...auth,'content-type':'application/json'},
       body:JSON.stringify({action:{type:'walkTo',x,z,running:false,reason:'isolated movement acceptance'}}),
       signal:AbortSignal.timeout(4000)
     });
     if(!actionResponse.ok)reject('actual SDK action was refused by authenticated gateway');
     const result=await actionResponse.json();
     if(!['queued_unverified','dispatched_unverified'].includes(result.status)||
         result.verifiedEffect!==false)reject('gateway incorrectly asserted an observed action');
     dispatchAttemptCount++;
     for(let i=0;i<5;i++){
       await delay(700);
       try {
         const actual=await reader.observe();
         if(actual.position.x!==sdkAnchor.position.x||actual.position.z!==sdkAnchor.position.z){
           moved=actual;break;
         }
       }catch(error){if(error.message.includes('replayed_native_observation'))continue;throw error}
     }
     if(moved)break;
   }
 } finally {
   await gateway.close();
 }
 if(!moved)reject('SDK walk action had no observed position change on isolated real engine');
 const savedPosition={...moved.position};
 // Client close is NOT a verified logout/save. Let the actual 377 idle
 // logout/save flow finish; look for the server-generated CRC save on disk.
 session.close();
 if(task26.transport.status().authenticated)reject('closed TCP was still admitted');
 try{
   await task26.transport.dispatch({type:'walk',x:sdkAnchor.position.x,z:sdkAnchor.position.z});
   reject('transport sent a packet after authenticated TCP logout');
 }catch(e){if(!/native_not_authenticated/.test(e.message))throw e;}
 try{
   session.send({type:'walk',x:sdkAnchor.position.x,z:sdkAnchor.position.z});
   reject('session sent a packet after TCP closure');
 }catch(e){if(!/No authenticated/.test(e.message))throw e;}
 const savePath='data/players/joshrs_ci_377/harnessprobe.sav';
 let verifiedSave=false;
 for(let attempt=0;attempt<105;attempt++){
   await delay(750);
   try {
     const {stat}=await import('node:fs/promises');
     const info=await stat(savePath);
     if(info.size>8){verifiedSave=true;break}
   }catch(error){if(error.code!=='ENOENT')throw error}
 }
 if(!verifiedSave)reject('no real player save generated after normal disconnect');
 // Also require the actual account to become reloggable: a second ordinary
 // network authentication, never a fake save parser or direct engine mutation.
 let relogged=null,reloggedObserver=null;
 for(let attempt=0;attempt<12;attempt++){
   const candidate=new Session377({
     target:{host:'127.0.0.1',port:gamePort,mode:'isolated'},
     username,password,publicKeyPem,crcs,timeoutMs:4500
   });
   try {
     const result=await candidate.connect();
     if(result.authenticated) {
       relogged=candidate;
       reloggedObserver=createEngine377Observer({
         port:managementPort,token,botName:username,expectedWorld
       });
       break;
     }
   }catch{
     candidate.close();
     await delay(650);
   }
 }
 if(!relogged)reject('disposable saved player could not relog by normal 377 TCP');
 let reloggedPosition=null;
 try {
   for(let attempt=0;attempt<12;attempt++){
     await delay(670);
     try {const snap=await reloggedObserver.observe();
       reloggedPosition=snap.position;break;
     }catch(error){
       if(error.message.includes('native_observer_http_409')||
          error.message.includes('replayed_native_observation'))continue;
       throw error;
     }
   }
   if(!reloggedPosition || reloggedPosition.x!==savedPosition.x||
      reloggedPosition.z!==savedPosition.z||
      reloggedPosition.plane!==savedPosition.plane)
     reject('normal relog did not restore observed walking position');
 }finally{relogged.close()}
 console.log(JSON.stringify({
   verified:'isolated_real_377_engine_observation',
   world:expectedWorld,revision:later.world.revision,
   bot:later.player.username,
   tickAdvanced:later.tick>first.tick,
   positionObserved:true,skillCount:later.skills.length,
   inventoryObserved:true,equipmentObserved:true,
   visibleNpcCount:later.nearbyNpcs.length,dialogueFlagsObserved:true,
   sdkStateComplete:false,
   genuineSdkGatewayAction:true,walkObserved:true,
   dispatchAttemptCount,saveRelogVerified:true,
   familyWorldTouched:false,
   task26RealBoundaryVerified:true,task26SecurityChecks:task26.checks,
   task26PacketDispatched:task26.packetDispatched,
   task26NoPacketAfterLogout:true
 }));
} finally {
 session.close();
}
