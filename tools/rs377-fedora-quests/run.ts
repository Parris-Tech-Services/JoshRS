#!/usr/bin/env bun
/**
 * JoshRS Fedora quest campaign, actual ORIGINAL pinned MaxBittker BotSDK.
 * Default is offline source-only. --run is explicitly disposable-only.
 *
 * Usage:
 * bun tools/rs377-fedora-quests/run.ts --plan
 * bun tools/rs377-fedora-quests/run.ts --run --all
 * bun tools/rs377-fedora-quests/run.ts --run --only cook
 */
import {readCatalogue,questPlan,planSummary} from './catalog.mjs';
import {dryCampaign,executeCampaign} from './campaign.mjs';
import {randomBytes} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync,existsSync,renameSync,chmodSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const PIN='db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
const args=process.argv.slice(2);
const has=s=>args.includes(s);
function opt(s){const i=args.indexOf(s);return i<0?null:args[i+1]??null}
const known=new Set(['--plan','--run','--all','--only','--oldest','--newest','--no-miniquests','--help']);
for(let i=0;i<args.length;i++)if(!known.has(args[i])&&!(i>0&&args[i-1]==='--only'))
 throw new Error('Unsupported flag: '+args[i]);
if(has('--help')){
 console.log('JoshRS rev377 Fedora RS-SDK. Default --plan (read-only). --run requires approved disposable native 377 gateway. --all or --only ID; --no-miniquests optional.');
 process.exit(0);
}
if(has('--run')&&has('--plan'))throw new Error('choose_run_or_plan');
if(has('--all')&&has('--only'))throw new Error('choose_all_or_only');
if(has('--oldest')&&has('--newest'))throw new Error('choose_oldest_or_newest');
if(has('--only')&&!opt('--only'))throw new Error('quest_id_required');
const catalogue=readCatalogue();
const queue=questPlan(catalogue,{
 newestFirst:!has('--oldest'),
 includeMiniquests:!has('--no-miniquests'),
 filter:opt('--only')
});
const summary=planSummary(queue);
if(!has('--run')){
 console.log(JSON.stringify({mode:'READ_ONLY_SOURCE_PLAN',...summary,
  sourceDigest:catalogue.sourceDigest,
  queue:queue.map(x=>({id:x.id,name:x.name,kind:x.kind,
    sourceStatus:x.sourceStatus,prerequisites:x.prerequisites,
    unresolvedPrerequisites:x.unresolvedPrerequisites,
    playableVerified:false}))
 },null,2));
 process.exit(0);
}
// This is the ONLY path that can send game actions.
assert.equal(process.env.JOSHRS_QUEST_CAMPAIGN_APPROVED,'DISPOSABLE_ONLY',
 'Explicit disposable-only operator approval required');
const home=process.env.RS377_UPSTREAM_SDK_HOME;
const username=process.env.RS377_SDK_BOT_USERNAME;
const worldId=process.env.RS377_SDK_WORLD_ID;
const token=process.env.RS377_SDK_TOKEN;
const gatewayUrl=process.env.RS377_SDK_GATEWAY_URL;
assert.ok(home&&username&&worldId&&token&&gatewayUrl,
 'Pinned SDK home and isolated gateway/account environment required');
assert.match(username,/^Harness[A-Za-z0-9_-]{1,10}$/);
assert.match(worldId,/^isolated-[a-z0-9_-]{4,64}$/i);
assert.ok(Buffer.byteLength(token,'utf8')>=32);
assert.match(gatewayUrl,/^ws:\/\/127\.0\.0\.1:\d{4,5}\/gateway$/);
const port=Number(new URL(gatewayUrl).port);
const forbidden=[52402,53402,8888,8898,8988,15402,18880,18881,45099,43500,43501,53500,53501,55099];
assert.ok(port>=1024&&port<=65535&&!forbidden.includes(port),
 'Never target a game/server/family port as SDK gateway');
const sdkFolder=path.resolve(home);
const sha=execFileSync('git',['-C',sdkFolder,'rev-parse','HEAD'],
 {encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']}).trim();
assert.equal(sha,PIN,'Original RS-SDK revision mismatch');
const dirty=execFileSync('git',['-C',sdkFolder,'status','--porcelain','--untracked-files=no'],
 {encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']}).trim();
assert.equal(dirty,'','Upstream SDK tracked source must remain unmodified');
const {BotSDK}=await import(pathToFileURL(path.join(sdkFolder,'sdk/index.ts')).href);
const {BotActions}=await import(pathToFileURL(path.join(sdkFolder,'sdk/actions.ts')).href);
assert.equal(typeof BotSDK,'function');assert.equal(typeof BotActions,'function');
const playbooks={};
for(const quest of queue){
 const p=path.join(path.dirname(fileURLToPath(import.meta.url)),'playbooks',quest.id+'.ts');
 if(existsSync(p)){
  const mod=await import(pathToFileURL(p).href);
  if(typeof mod.run!=='function')throw new Error('Playbook missing run(): '+quest.id);
  playbooks[quest.id]=mod.run;
 }
}
// A private, atomic per-quest checkpoint ledger is used for crashes/interrupts.
// Never store tokens, account names, raw game inventory or protected content.
const reportFolder=path.join(os.homedir(),'.local','state','joshrs-quests');
mkdirSync(reportFolder,{recursive:true,mode:0o700});
chmodSync(reportFolder,0o700);
const filename=path.join(reportFolder,'campaign-'+Date.now()+'-'+randomBytes(5).toString('hex')+'.json');
function save(data){
 const tmp=filename+'.tmp';
 writeFileSync(tmp,JSON.stringify(data,null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'w'});
 chmodSync(tmp,0o600);
 renameSync(tmp,filename);
 chmodSync(filename,0o600);
}
const sdk=new BotSDK({botUsername:username,password:token,gatewayUrl,
 autoLaunchBrowser:false,autoReconnect:false,showChat:false,readyTimeout:0,
 connectTimeout:9000,actionTimeout:11000});
try {
 await sdk.connect();
 if(sdk.isAuthenticated()!==true)throw new Error('upstream_sdk_not_authenticated');
 let state=null;
 for(let i=0;i<50;i++){
  state=sdk.getState();
  if(state?.inGame===true&&state.player?.name===username&&
     Number.isSafeInteger(state.tick))break;
  await new Promise(done=>setTimeout(done,150));
 }
 if(!state?.inGame||state.player?.name!==username||
    !Number.isSafeInteger(state.tick))
   throw new Error('native_authenticated_game_state_missing');
 const bot=new BotActions(sdk);
 const result=await executeCampaign({catalogue,plan:queue,sdk,bot,username,worldId,
   playbooks,onCheckpoint:save,maxActionsPerQuest:50});
 save(result);
 const counts={};
 for(const row of result.records)counts[row.status]=(counts[row.status]||0)+1;
 console.log(JSON.stringify({mode:'DISPOSABLE_377_REAL_SDK_CAMPAIGN',
   sourceSha:PIN,worldCategory:'isolated-only',queue:queue.length,
   observedQuestVarps:Object.keys(state.joshrsQuestStages??{}).length,
   counts,fullQuestPlaythroughsVerified:0,
   report:filename,
   caution:'A real normal-player action is NOT proof of quest completion. No source-only labels promoted.'
 },null,2));
}finally{
 try{await sdk.disconnect()}catch{}
}
process.exit(0);
