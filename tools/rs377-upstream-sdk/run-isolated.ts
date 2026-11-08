#!/usr/bin/env bun
/**
 * Use the ORIGINAL MaxBittker RS-SDK BotSDK + BotActions classes with JoshRS.
 * Never imports or replaces its enhanced 225 client/server; rev377 gateway
 * maps safe, observed player actions to ordinary native game packets.
 * All connected actions restricted to an explicitly isolated local game.
 */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const UPSTREAM_SHA='db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
const mode=process.argv[2]??'--check';
const home=process.env.RS377_UPSTREAM_SDK_HOME;
if(!home)throw new Error('Set RS377_UPSTREAM_SDK_HOME to the pinned SDK install folder');
const directory=resolve(home);
const actual=execFileSync('git',['-C',directory,'rev-parse','HEAD'],
  {encoding:'utf8',timeout:5000}).trim();
assert.equal(actual,UPSTREAM_SHA,'Upstream source commit mismatch');
const {BotSDK}=await import(pathToFileURL(resolve(directory,'sdk/index.ts')).href);
const {BotActions}=await import(pathToFileURL(resolve(directory,'sdk/actions.ts')).href);
assert.equal(typeof BotSDK,'function');
assert.equal(typeof BotActions,'function');
if(mode==='--check'){
 console.log('JOSHRS_UPSTREAM_SDK_PINNED_AND_LOADED: '+UPSTREAM_SHA);
 console.log('Original upstream BotSDK and BotActions loaded; no game connection.');
 process.exit(0);
}
const target=process.env.RS377_SDK_GATEWAY_URL??'';
const username=process.env.RS377_SDK_BOT_USERNAME??'';
const world=process.env.RS377_SDK_WORLD_ID??'';
const token=process.env.RS377_SDK_TOKEN??'';
assert.match(target,/^ws:\/\/127\.0\.0\.1:\d{4,5}\/gateway$/);
const port=Number(new URL(target).port);
assert.ok(port>=1024&&port<=65535&&
  ![52402,8888,45099,43500,15402,18880,18881].includes(port),
  'A separate loopback-only, non-family gateway is mandatory');
assert.match(username,/^Harness[A-Za-z0-9_-]{1,10}$/);
assert.match(world,/^isolated-[a-z0-9_-]{4,64}$/i);
assert.ok(Buffer.byteLength(token)>=32,'Use a strong ephemeral private token');
if(!['--observe','--walk','--script'].includes(mode))throw new Error('Unsupported mode');
const sdk=new BotSDK({botUsername:username,password:token,gatewayUrl:target,
  autoLaunchBrowser:false,autoReconnect:false,readyTimeout:0,
  connectTimeout:9000,actionTimeout:11000,showChat:false});
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
try{
 await sdk.connect();
 assert.equal(sdk.isAuthenticated(),true);
 let state;
 for(let i=0;i<40;i++){
  state=sdk.getState();
  if(state?.inGame&&state.player?.name===username)break;
  await sleep(125);
 }
 assert.equal(state?.inGame,true,'Real native state unavailable');
 assert.equal(state.player.name,username);
 const bot=new BotActions(sdk);
 if(mode==='--observe'){
  console.log(JSON.stringify({status:'observed_only',bot:username,tick:state.tick,
   position:{x:state.player.worldX,z:state.player.worldZ},
   skills:state.skills.length,isolatedWorldConfigured:world,
   fullSDKLoaded:true,questCompleted:false}));
 }else if(mode==='--walk'){
  const x=Number(process.argv[3]),z=Number(process.argv[4]);
  if(!Number.isSafeInteger(x)||!Number.isSafeInteger(z)||
     Math.max(Math.abs(state.player.worldX-x),Math.abs(state.player.worldZ-z))>12)
   throw new Error('Walk must target a verified nearby tile (<=12 tiles)');
  const result=await sdk.sendWalk(x,z,false);
  assert.equal(result.success,true,'SDK movement was not confirmed by native observer');
  assert.equal(result.phase,'completion','SDK send is not proof of movement');
  const next=sdk.getState();
  // A delayed state update may follow the native gateway confirmation.
  let confirmed=next?.player?.worldX===x&&next?.player?.worldZ===z;
  for(let i=0;i<20&&!confirmed;i++){
   await sleep(125);
   const latest=sdk.getState();confirmed=latest?.player?.worldX===x&&latest?.player?.worldZ===z;
  }
  assert.ok(confirmed,'position not observed through upstream state stream');
  console.log(JSON.stringify({status:'native_walk_verified',bot:username,x,z}));
 }else{
  const entry=process.argv[3];
  if(!entry)throw new Error('Explicit local script path required');
  const mod=await import(pathToFileURL(resolve(entry)).href);
  if(typeof mod.run!=='function')throw new Error('Script must export async run({sdk,bot})');
  // Only a locally chosen module, only a separate Harness world, and normal
  // rev377 allowlisted SDK actions. Unsupported upstream actions fail closed.
  const outcome=await mod.run({sdk,bot});
  console.log(JSON.stringify({status:'script_returned_not_quest_verified',
    bot:username,returned:outcome!==undefined}));
 }
}finally{
 await sdk.disconnect();
}
process.exit(0);
