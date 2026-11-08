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
import {toBotWorldState} from './src/sdk-bridge.mjs';
import {createSdk377Gateway} from './src/sdk-gateway.mjs';
import {verifyRealEngineGateway} from '../rs377-controller-boundary/test/real-engine-security.acceptance.mjs';
import {createSdk377WebSocket} from './src/sdk-websocket.mjs';

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
 // Task 27: require genuine server ZoneMap visibility, not fixture-filled
 // object state or an empty array substituted for an unsupported field.
 if(!Array.isArray(first.nearbyLocs) || !Array.isArray(first.groundItems))
   reject('real native nearby locs and ground items are still unsupported');
 if(!first.nearbyLocs.every(loc=>Number.isInteger(loc.id) &&
    Number.isInteger(loc.x)&&Number.isInteger(loc.z)&&
    loc.level===first.position.plane &&
    Math.max(Math.abs(loc.x-first.position.x),Math.abs(loc.z-first.position.z))<=16))
   reject('native nearby loc projection has invalid or nonlocal entries');
 if(!first.groundItems.every(obj=>Number.isInteger(obj.id)&&Number.isInteger(obj.count) &&
    obj.count>0&&Number.isInteger(obj.x)&&Number.isInteger(obj.z)&&
    Math.max(Math.abs(obj.x-first.position.x),Math.abs(obj.z-first.position.z))<=16))
   reject('native ground item projection has invalid or nonlocal entries');
 // Task 28: require native, bot-scoped prayer and UI/bank/combat foundations.
 // These are *not* full client SDK state. The native observer must preserve
 // null for unavailable client message/history/death/combat event telemetry.
 const details=first.sdkDetails;
 const gaps=[];
 if(!details)gaps.push('sdkDetails');
 if(!Array.isArray(details?.nearbyPlayers))gaps.push('nearbyPlayers');
 if(details?.nearbyPlayers?.some(p=>p.kind!=='player'||
   !Number.isInteger(p.index)||p.name===username||p.distance>16))
   gaps.push('nearbyPlayers_visibility');
 if(!details?.playerBase || details.playerBase.name!==username ||
    details.playerBase.x!==first.position.x ||
    details.playerBase.z!==first.position.z ||
    !Number.isInteger(details.playerBase.hp))gaps.push('playerBase');
 if(!details?.prayers||details.prayers.activePrayers?.length!==15 ||
    !details.prayers.activePrayers.every(p=>typeof p==='boolean')||
    !Number.isInteger(details.prayers.prayerLevel))gaps.push('prayers');
 if(details?.bank?.isOpen!==false)gaps.push('closed_bank');
 if(details?.shop?.isOpen!==false)gaps.push('closed_shop');
 if(details?.interface!==null && (
    typeof details?.interface?.isOpen!=='boolean' ||
    !Number.isSafeInteger(details.interface.interfaceId) ||
    !Array.isArray(details.interface.options) ||
    (details.interface.isOpen && details.interface.interfaceId<0) ||
    (details.interface.isOpen && !details.modalOpen)))
   gaps.push('interface_unrecognised');
 if(details?.player!==null && details?.player?.name!==username)gaps.push('player_identity');
 if(details?.gameMessages!==null&&!Array.isArray(details?.gameMessages))gaps.push('messages');
 if(details?.recentDialogs!==null&&!Array.isArray(details?.recentDialogs))gaps.push('dialogs');
 if(details?.combatEvents!==null&&!Array.isArray(details?.combatEvents))gaps.push('combat');
 if(gaps.length)reject('authentic isolated SDK foundations invalid: '+gaps.join(','));
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
 // Explain only the first missing authoritative type, never log raw state,
 // other players' details, private data, passwords, account DB or tokens.
 try {
   toBotWorldState(later,{botName:username,expectedWorld});
   console.log('Isolated pinned RS-SDK state: contract verified from native game');
 } catch(error) {
   const kind=String(error?.message??'').match(/^SDK state incomplete: ([a-zA-Z0-9_., -]{1,100}) is not verified/);
   console.log('Isolated pinned RS-SDK state unavailable: '+(kind?.[1]??'contract_blocked'));
 }
 // Task 26: use the very same already-authenticated REAL #377 TCP client.
 // The boundary verifies security through the real engine observer and real
 // ISAAC-wrapped normal walk; it does not replace or restart the game.
 const task26=await verifyRealEngineGateway({
   session,managementPort,token,botName:username,worldId:expectedWorld
 });
 if(task26.checks.length!==11||!task26.packetDispatched)
   reject('real engine boundary gateway security checks incomplete');
 // Task 26 may have moved this ordinary player. Refresh the SDK baseline so
 // subsequent SDK success can only count movement occurring AFTER its own action.
 const sdkAnchor=await reader.observe();


 // Execute a GENUINE SDK BotAction via the authenticated local gateway. The
 // gateway uses actual engine observations, the rev377 packet encoder and
 // ISAAC-protected TCP. Action success requires an observed position delta.
 let moved=null, dispatchAttemptCount=0, completeSdkStateVerified=false;
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
   if(stateResponse.status===200) {
     const actual=await stateResponse.json();
     const worldState=actual?.state??actual;
     if(!worldState?.inGame || worldState?.player?.name!==username ||
        !Array.isArray(worldState.skills)||worldState.skills.length!==21||
        !Array.isArray(worldState.nearbyLocs)||
        !Array.isArray(worldState.groundItems)||
        !Array.isArray(worldState.prayers?.activePrayers)||
        worldState.prayers.activePrayers.length!==15 ||
        worldState.bank?.isOpen!==false || worldState.shop?.isOpen!==false)
       reject('SDK state claimed complete but lacks real player, UI, world and prayer fields');
     completeSdkStateVerified=true;
   } else if(stateResponse.status!==409) {
     reject('SDK state neither securely available nor fail-closed 409');
   }
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

 // Prove the *actual pinned upstream WebSocket envelope* (sdk_connect /
 // sdk_connected / sdk_action / sdk_action_result) with the SAME normal TCP
 // game session and a fresh authenticated native 377 observer. This is a
 // subset while full BotWorldState remains unsupported and clearly rejected.
 const websocketToken=randomBytes(32).toString('hex');
 const wsObserver=createEngine377Observer({port:managementPort,token,
   botName:username,expectedWorld});
 const wsRuntime=createSdk377Runtime({
   session,observer:wsObserver,botName:username,expectedWorld
 });
 const webSocketGateway=createSdk377WebSocket({runtime:wsRuntime,botName:username,
   token:websocketToken});
 let websocketVerified=false;
 await webSocketGateway.listen(18883);
 const sdkSocket=new WebSocket('ws://127.0.0.1:18883/gateway');
 const sdkReplies=[];
 const waitWs=(predicate,timeout=8000)=>new Promise((resolve,reject)=>{
   const started=Date.now();
   const timer=setInterval(()=>{
     const found=sdkReplies.find(predicate);
     if(found){clearInterval(timer);resolve(found)}
     else if(Date.now()-started>timeout){clearInterval(timer);reject(new Error('real upstream SDK wire response timeout'))}
   },35);
 });
 sdkSocket.addEventListener('message',e=>{
   try{sdkReplies.push(JSON.parse(e.data))}catch{}
 });
 try {
   await new Promise((resolve,reject)=>{
     const timer=setTimeout(()=>reject(new Error('WebSocket TCP open timeout')),3000);
     sdkSocket.addEventListener('open',()=>{clearTimeout(timer);resolve()},{once:true});
     sdkSocket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('WebSocket transport error'))},{once:true});
   });
   sdkSocket.send(JSON.stringify({type:'sdk_connect',username,password:websocketToken,
     clientId:'isolated-joshrs-ci-probe',mode:'control'}));
   await waitWs(msg=>msg.type==='sdk_connected'&&msg.success===true);
   // It MUST NOT send invented sdk_state for unknown UI/shop/bank fields.
   if(completeSdkStateVerified) {
     const result=await waitWs(msg=>msg.type==='sdk_state'&&
       msg.state?.player?.name===username,8000);
     if(!Array.isArray(result.state.skills)||result.state.skills.length!==21)
       reject('actual upstream SDK envelope omitted authoritative skill array');
   } else {
     await waitWs(msg=>msg.type==='sdk_error'&&
       msg.error==='authoritative_sdk_state_incomplete');
   }
   const before=moved.position;
   const trials=[[before.x+1,before.z],[before.x,before.z+1],
     [before.x-1,before.z],[before.x,before.z-1]];
   for(let trial=0;trial<trials.length;trial++){
     const [x,z]=trials[trial];
     const actionId='isolated-genuine-'+trial;
     await delay(750);
     sdkSocket.send(JSON.stringify({type:'sdk_action',username,actionId,
       action:{type:'walkTo',x,z,running:false,reason:'live pinned SDK WebSocket acceptance'},
       actionTimeoutMs:5500}));
     const result=await waitWs(msg=>msg.type==='sdk_action_result'&&msg.actionId===actionId,9000);
     if(result.result?.success===true && result.result?.phase==='completion' &&
         result.result?.data?.verifiedEffect===true){
       await delay(650);
       const after=await reader.observe();
       if(after.position.x!==x||after.position.z!==z)
         reject('upstream SDK gateway reported an unobserved target');
       moved=after;websocketVerified=true;break;
     }
   }
   if(!websocketVerified)reject('real upstream SDK WebSocket walked no reachable tile');
 } finally {
   sdkSocket.close();
   await webSocketGateway.close();
 }
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
   visibleNpcCount:later.nearbyNpcs.length,
   nearbyLocsObserved:Array.isArray(later.nearbyLocs),
   nearbyLocCount:later.nearbyLocs.length,
   groundItemsObserved:Array.isArray(later.groundItems),
   groundItemCount:later.groundItems.length,
   playerBaseObserved:true,prayersObserved:true,
   nearbyPlayersObserved:true,bankClosedObserved:true,shopClosedObserved:true,
   dialogueFlagsObserved:true,
   sdkStateComplete:completeSdkStateVerified,
   genuineSdkGatewayAction:true,walkObserved:true,
   genuineSdkWebSocketAction:websocketVerified,
   dispatchAttemptCount,saveRelogVerified:true,
   familyWorldTouched:false,
   task26RealBoundaryVerified:true,task26SecurityChecks:task26.checks,
   task26PacketDispatched:task26.packetDispatched,
   task26NoPacketAfterLogout:true
 }));
} finally {
 session.close();
}
