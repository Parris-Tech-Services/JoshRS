#!/usr/bin/env bun
/**
 * Genuine, unmodified upstream RS-SDK class against the disposable native 377
 * world. Called only by probe-real-isolated377.mjs while its session is alive.
 *
 * Receives ephemeral gateway credential on stdin (not CLI/logs), never reads
 * family-game saves, and never writes user profiles, passwords or account DBs.
 */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const PIN='db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
const sdkHome=process.argv[2];
if(!sdkHome)throw new Error('Pinned upstream SDK checkout required');
const checkout=resolve(sdkHome);
const commit=execFileSync('git',['-C',checkout,'rev-parse','HEAD'],{encoding:'utf8',timeout:5000}).trim();
assert.equal(commit,PIN,'upstream SDK source differs from reviewed pin');

const {BotSDK}=await import(pathToFileURL(resolve(checkout,'sdk/index.ts')).href);
const {BotActions}=await import(pathToFileURL(resolve(checkout,'sdk/actions.ts')).href);
assert.equal(typeof BotSDK,'function','real upstream class must be imported');
assert.equal(typeof BotActions,'function','real upstream action class must be imported');

const input=JSON.parse(await Bun.stdin.text());
const {gatewayUrl,token,botName,worldId,candidates}=input;
assert.equal(botName,'HarnessProbe');
assert.equal(worldId,'isolated-joshrs-ci-377');
assert.match(gatewayUrl,/^ws:\/\/127\.0\.0\.1:\d{4,5}\/gateway$/);
const port=Number(new URL(gatewayUrl).port);
assert.ok(port>1024&&![52402,8888,45099,43500,15402,18880,18881].includes(port));
assert.ok(typeof token==='string'&&Buffer.byteLength(token)>=32);
assert.ok(Array.isArray(candidates)&&candidates.length===4);
assert.ok(candidates.every(p=>Array.isArray(p)&&p.length===2&&
  p.every(n=>Number.isInteger(n)&&n>0&&n<16384)));

const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const sdk=new BotSDK({botUsername:botName,password:token,gatewayUrl,
  autoLaunchBrowser:false,autoReconnect:false,showChat:false,
  readyTimeout:0,connectTimeout:9000,actionTimeout:11000});
let authenticated=false,first=null,second=null,walked=false,actionsClass=false;
try{
 await sdk.connect();
 authenticated=sdk.isAuthenticated();
 assert.equal(authenticated,true,'authentic upstream SDK WebSocket authentication');
 for(let i=0;i<40;i++){
  first=sdk.getState();
  if(first?.inGame&&first?.player?.name===botName)break;
  await sleep(125);
 }
 assert.ok(first?.inGame&&first.player.name===botName,'real native full BotWorldState needed');
 assert.ok(first.tick>=0&&first.skills.length===21&&Array.isArray(first.nearbyLocs));
 const startTick=first.tick;
 for(let i=0;i<30;i++){
  second=sdk.getState();
  if(second?.tick>startTick)break;
  await sleep(130);
 }
 assert.ok(second?.tick>startTick,'actual game tick must advance over upstream SDK stream');
 const bot=new BotActions(sdk);
 actionsClass=typeof bot.walkTo==='function'&&typeof bot.talkToNpc==='function'&&
   typeof bot.openBank==='function';
 assert.ok(actionsClass,'entire upstream BotActions class must be available');
 const origin={x:second.player.worldX,z:second.player.worldZ};
 for(const [x,z] of candidates){
  if(Math.max(Math.abs(origin.x-x),Math.abs(origin.z-z))>2)continue;
  const sent=await sdk.sendWalk(x,z,false);
  if(sent.success!==true||sent.phase!=='completion'||sent.data?.verifiedEffect!==true)continue;
  for(let attempt=0;attempt<25;attempt++){
   const state=sdk.getState();
   if(state?.tick>startTick&&state.player?.worldX===x&&state.player?.worldZ===z){
    walked=true;break;
   }
   await sleep(160);
  }
  if(walked)break;
 }
 assert.equal(walked,true,'real upstream BotSDK walk must change native player position');
 console.log('RS_SDK_REAL_NATIVE_PROOF:'+JSON.stringify({
  source:'MaxBittker/rs-sdk',sourceSha:PIN,bot:'HarnessProbe',
  realNative377World:true,authenticated,continuousNativeState:true,
  actualUpstreamBotSDK:true,actualUpstreamBotActions:true,
  ordinaryPacketEffectVerified:true,saveRelogVerifiedByParent:false,
  tenPubPlaythroughVerified:false,familyWorldTouched:false
 }));
}finally{
 await sdk.disconnect();
}
// The real SDK owns background timers; its authenticated controller has
// disconnected and no source/private data has been written.
process.exit(0);
