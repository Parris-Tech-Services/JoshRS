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
 // This test proves fields are sampled from the actual isolated compiled
 // server, not that any specific NPC is spawned nearby or a quest was done.
 console.log(JSON.stringify({
   verified:'isolated_real_377_engine_observation',
   world:expectedWorld,revision:later.world.revision,
   bot:later.player.username,
   tickAdvanced:later.tick>first.tick,
   positionObserved:true,skillCount:later.skills.length,
   inventoryObserved:true,equipmentObserved:true,
   visibleNpcCount:later.nearbyNpcs.length,dialogueFlagsObserved:true,
   sdkStateComplete:false,saveRelogVerified:false,
   familyWorldTouched:false
 }));
} finally {
 session.close();
}
