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
assert.ok(Array.isArray(candidates)&&candidates.length===5);
assert.ok(candidates.every(p=>Array.isArray(p)&&p.length===2&&
  p.every(n=>Number.isInteger(n)&&n>0&&n<16384)));

const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const sdk=new BotSDK({botUsername:botName,password:token,gatewayUrl,
  autoLaunchBrowser:false,autoReconnect:false,showChat:false,
  readyTimeout:0,connectTimeout:9000,actionTimeout:11000});
let authenticated=false,first=null,second=null,walked=false,actionsClass=false,finalPosition=null;
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
 actionsClass=typeof bot.walkTo==='function'&&typeof bot.talkTo==='function'&&
   typeof bot.openBank==='function';
 assert.ok(actionsClass,'entire upstream BotActions class must be available');
 // Exercise the actual full upstream SDK's on-demand action methods
 // through the native 377 loopback gateway. No mock state, no game packets.
 const locScan=await sdk.scanNearbyLocs(8);
 assert.ok(Array.isArray(locScan),'upstream SDK native loc scan must return an array');
 assert.ok(locScan.length>0,'native ZoneMap must show actual nearby locs');
 assert.ok(locScan.every(loc=>second.nearbyLocs.some(real=>
   loc.id===real.id&&loc.x===real.x&&loc.z===real.z)),
   'native scan must only return locs also visible in authoritative SDK state');
 const groundScan=await sdk.scanGroundItems(8);
 assert.ok(Array.isArray(groundScan),'upstream SDK native ground scan must return an array');
 assert.ok(groundScan.every(obj=>second.groundItems.some(real=>
   obj.id===real.id&&obj.x===real.x&&obj.z===real.z)),
   'native ground scan must not invent world objects');
 const nativeWait=await sdk.sendWait(1);
 assert.ok(nativeWait.success===true&&nativeWait.phase==='completion',
   'upstream SDK wait must observe an actual native game tick');
 const origin={x:second.player.worldX,z:second.player.worldZ};
 for(const [x,z] of candidates){
  if(Math.max(Math.abs(origin.x-x),Math.abs(origin.z-z))>2)continue;
  const sent=await sdk.sendWalk(x,z,false);
  console.error('RS_SDK_ACTION_DIAGNOSTIC:'+JSON.stringify({target:[x,z],
    success:sent.success,phase:sent.phase,reason:sent.reason??null,
    message:String(sent.message??'').slice(0,130)}));
  if(sent.success!==true||sent.phase!=='completion'||sent.data?.verifiedEffect!==true)continue;
  for(let attempt=0;attempt<25;attempt++){
   const state=sdk.getState();
   if(state?.tick>startTick&&state.player?.worldX===x&&state.player?.worldZ===z){
    walked=true;finalPosition={x,z};break;
   }
   await sleep(160);
  }
  if(walked)break;
 }
 if(!walked)throw new Error('real upstream BotSDK never observed an ordinary walk on any verified nearby tile');
 // Run the entire 104-quest + 7-miniquest queue against this *real* SDK
 // session. Only the reviewed Cook start-NPC probe may act. All others
 // remain explicitly BLOCKED, never magically marked complete.
 const {readCatalogue,questPlan}=await import('../rs377-fedora-quests/catalog.mjs');
 const {executeCampaign}=await import('../rs377-fedora-quests/campaign.mjs');
 const {run:probeCook}=await import('../rs377-fedora-quests/playbooks/cook.ts');
 const sourceQueue=readCatalogue();
 const plan=questPlan(sourceQueue,{includeMiniquests:true,newestFirst:true});
 const liveState=sdk.getState() as unknown as {joshrsQuestStages?:Record<string,unknown>};
 const nativeQuestVarpCount=Object.keys(liveState?.joshrsQuestStages??{}).length;
 assert.ok(Number.isInteger(nativeQuestVarpCount)&&nativeQuestVarpCount>=1,
   'no independently observed quest varps through the unmodified RS-SDK');
 const campaign=await executeCampaign({
   catalogue:sourceQueue,plan,sdk,bot,username:botName,worldId,
   playbooks:{cook:probeCook},maxActionsPerQuest:2
 });
 assert.equal(campaign.records.length,111,'every historical quest must be classified');
 assert.equal(campaign.actualFullQuestPlaythroughsVerified,0,
   'source and partial NPC probes must not pass a full quest');
 const campaignStatuses=Object.fromEntries([...new Set(campaign.records.map(x=>x.status))].map(
   status=>[status,campaign.records.filter(x=>x.status===status).length]));
 console.error('RS_SDK_REAL_QUEST_CAMPAIGN:'+JSON.stringify({
   questCount:104,miniquestCount:7,sourceSha:PIN,authenticEngine:true,
   nativeQuestVarpCount,campaignStatuses,fullPlaythroughsVerified:0,
   familyWorldTouched:false
 }));
 console.log('RS_SDK_REAL_NATIVE_PROOF:'+JSON.stringify({
  source:'MaxBittker/rs-sdk',sourceSha:PIN,bot:'HarnessProbe',
  realNative377World:true,authenticated,continuousNativeState:true,
  actualUpstreamBotSDK:true,actualUpstreamBotActions:true,
  ordinaryPacketEffectVerified:true,realNativeScanVerified:true,
  realNativeWaitVerified:true,finalPosition,saveRelogVerifiedByParent:false,
  questCatalogCount:campaign.records.length,questCount:104,miniquestCount:7,
  observedQuestVarpCount:nativeQuestVarpCount,questCampaignStatuses:campaignStatuses,
  fullQuestPlaythroughsVerified:0,
  tenPubPlaythroughVerified:false,familyWorldTouched:false
 }));
}finally{
 await sdk.disconnect();
}
// The real SDK owns background timers; its authenticated controller has
// disconnected and no source/private data has been written.
process.exit(0);
