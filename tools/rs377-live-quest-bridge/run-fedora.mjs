#!/usr/bin/env bun
/**
 * Authorised Fedora family-world native RS-SDK quest session.
 *
 * Default --check is read-only, OFFLINE and safe while Elrothiro is playing.
 * --run opens only one NORMAL TCP connection as HarnessView1 and a loopback
 * authenticated SDK gateway. It NEVER starts/stops/restarts the game server.
 * Observer hook MUST be separately installed in the real engine beforehand.
 *
 * NOT proof that Cook's Assistant has been completed; each native action must
 * be independently corroborated. No save/varp/XP mutators exist here.
 */
import {existsSync,readFileSync,statSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createPublicKey,randomBytes} from 'node:crypto';
import {execFileSync,execFile} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {Session377} from '../rs377-chatgpt-bridge/src/session.mjs';
import {createEngine377Observer} from '../rs377-chatgpt-bridge/src/engine-observer.mjs';
import {createSdk377Runtime} from '../rs377-chatgpt-bridge/src/sdk-runtime.mjs';
import {createSdk377WebSocket} from '../rs377-chatgpt-bridge/src/sdk-websocket.mjs';
import {run as runCook,stage,cookingXp} from '../rs377-fedora-quests/playbooks/cook.ts';

const PIN='db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
const ROOT=path.join(os.homedir(),'dev/JoshRS/lostcity377');
const ENGINE=path.join(ROOT,'engine');
const BOT='HarnessView1', WORLD='family-joshrs-377';
const PINNED=path.join(os.homedir(),'.local/share/joshrs','rs-sdk-'+PIN);
const LOGIN_PORT=52402, WEB_PORT=8888, MANAGE_PORT=8898, SDK_PORT=18883;
const args=process.argv.slice(2);
const RUN=args.length===1&&args[0]==='--run';
const CHECK=args.length===0||(args.length===1&&args[0]==='--check');
if(!RUN&&!CHECK)throw new Error('Usage: bun tools/rs377-live-quest-bridge/run-fedora.mjs --check|--run');
const file=path.join(ENGINE,'data/config/private.pem');

export function scopeCheck({fedora=true,uid=1000,world=WORLD,bot=BOT,approval=''}={}){
 if(!fedora||uid===0||world!==WORLD||bot!==BOT)
  throw new Error('family_bot_scope_refused');
 if(approval!==BOT)throw new Error('explicit_bot_approval_required');
 return true;
}
function verifyPinnedSdk(){
 if(!existsSync(path.join(PINNED,'.git')))throw new Error('pinned_RS_SDK_not_installed');
 const sha=execFileSync('git',['-C',PINNED,'rev-parse','HEAD'],{encoding:'utf8',timeout:5000}).trim();
 if(sha!==PIN)throw new Error('pinned_RS_SDK_revision_mismatch');
 if(execFileSync('git',['-C',PINNED,'status','--porcelain','--untracked-files=no'],{encoding:'utf8',timeout:5000}).trim())
  throw new Error('modified_upstream_RS_SDK_refused');
}
function verifyFedora(){
 const osRelease=readFileSync('/etc/os-release','utf8');
 if(!/^ID=("|')?fedora\b/m.test(osRelease))throw new Error('Fedora_required');
 if(process.getuid?.()===0)throw new Error('run_as_normal_Fedora_user');
}
async function hiddenInput(label){
 if(!process.stdin.isTTY||!process.stderr.isTTY)throw new Error('interactive_local_terminal_required');
 process.stderr.write(label);
 const {spawnSync}=await import('node:child_process');
 const muted=spawnSync('stty',['-echo'],{stdio:['inherit','ignore','ignore']}).status===0;
 if(!muted)throw new Error('failed_to_disable_terminal_echo');
 try {
  return await new Promise((resolve,reject)=>{
   let answer='';
   const onData=chunk=>{
    answer+=chunk.toString('utf8');
    const index=answer.indexOf('\n');
    if(index>=0){
     process.stdin.off('data',onData);
     process.stdin.pause();
     resolve(answer.slice(0,index).replace(/\r$/,''));
    }else if(answer.length>1024){
     process.stdin.off('data',onData);reject(new Error('secret_input_too_long'));
    }
   };
   process.stdin.resume();process.stdin.on('data',onData);
  });
 }finally {
  spawnSync('stty',['echo'],{stdio:['inherit','ignore','ignore']});
  process.stderr.write('\n');
 }
}
async function crc(){
 const response=await fetch('http://127.0.0.1:'+WEB_PORT+'/crc0',
  {redirect:'error',signal:AbortSignal.timeout(4000)});
 if(!response.ok)throw new Error('real_family_cache_CRC_unavailable');
 const value=Buffer.from(await response.arrayBuffer());
 if(value.length!==40)throw new Error('real_377_cache_crc_mismatch');
 return Buffer.from(value.subarray(0,36));
}
async function main(){
 verifyFedora();
 if(!existsSync(file))throw new Error('real_Fedora_377_private_key_missing');
 if(!statSync(file).isFile())throw new Error('unexpected_engine_key_type');
 verifyPinnedSdk();
 if(CHECK) {
  console.log('READ_ONLY_CHECK_PASSED: Fedora, family engine and pinned original RS-SDK found.');
  console.log('This is NOT evidence that the bot-only observer hook is installed.');
  console.log('Normal game port 52402, site 8888, management 8898; private SDK 18883.');
  console.log('No server, save, client or bot account has been changed.');
  return;
 }
 scopeCheck({fedora:true,uid:process.getuid?.(),approval:process.env.JOSHRS_FAMILY_SDK_APPROVED});
 if(process.env.RS377_FAMILY_SERVER_INSTRUMENTED!=='true')
  throw new Error('family_native_observer_not_installed_or_not_approved_for_this_run');
 // No observer token or bot password is stored in source, env, shell history or
 // a process argument; the operator supplies both privately in this TTY.
 const observerToken=await hiddenInput('Live bot-only observer token (hidden): ');
 if(Buffer.byteLength(observerToken)<32)throw new Error('observer_token_too_short');
 const botPassword=await hiddenInput('HarnessView1 login password (hidden): ');
 if(!botPassword||botPassword.length>20)throw new Error('normal_377_bot_password_invalid');
 const publicKeyPem=createPublicKey(readFileSync(file,'utf8')).export({format:'pem',type:'spki'});
 const crcs=await crc();
 const native=new Session377({
  target:{host:'127.0.0.1',port:LOGIN_PORT,mode:'family',approvedFamily:true},
  username:BOT,password:botPassword,publicKeyPem,crcs,timeoutMs:9000
 });
 let gateway=null,sdk=null;
 try {
  const login=await native.connect();
  if(login.authenticated!==true||native.status().mode!=='family')
   throw new Error('real_family_bot_not_authenticated');
  const reader=createEngine377Observer({
   port:MANAGE_PORT,token:observerToken,botName:BOT,
   expectedWorld:WORLD,approvedFamily:true
  });
  let real=null;
  for(let i=0;i<16;i++){
   try{real=await reader.observe();break}
   catch(err){
    if(!/replayed_native_observation|native_observer_http_409/.test(String(err?.message??'')))throw err;
    await new Promise(resolve=>setTimeout(resolve,650));
   }
  }
  if(real?.player?.username!==BOT||real?.world?.instanceId!==WORLD)
   throw new Error('authoritative_live_family_bot_observation_missing');
  const gatewayToken=randomBytes(32).toString('hex');
  const runtime=createSdk377Runtime({
   session:native,observer:createEngine377Observer({
    port:MANAGE_PORT,token:observerToken,botName:BOT,expectedWorld:WORLD,approvedFamily:true
   }),botName:BOT,expectedWorld:WORLD,approvedFamily:true
  });
  gateway=createSdk377WebSocket({runtime,botName:BOT,token:gatewayToken});
  await gateway.listen(SDK_PORT);
  const {BotSDK}=await import(pathToFileURL(path.join(PINNED,'sdk/index.ts')).href);
  const {BotActions}=await import(pathToFileURL(path.join(PINNED,'sdk/actions.ts')).href);
  sdk=new BotSDK({
   botUsername:BOT,password:gatewayToken,
   gatewayUrl:'ws://127.0.0.1:'+SDK_PORT+'/gateway',
   autoLaunchBrowser:false,autoReconnect:false,showChat:false,
   readyTimeout:0,connectTimeout:9000,actionTimeout:11000
  });
  await sdk.connect();
  if(sdk.isAuthenticated()!==true)throw new Error('upstream_RS_SDK_not_authenticated');
  let state=null;
  for(let i=0;i<45;i++){
   state=sdk.getState();
   if(state?.inGame&&state?.player?.name===BOT&&Number.isSafeInteger(state.tick))break;
   await new Promise(resolve=>setTimeout(resolve,200));
  }
  if(!state?.inGame||state.player?.name!==BOT)throw new Error('real_BotWorldState_not_available');
  console.log('BOT_NATIVE_SDK_CONNECTED: authenticated HarnessView1, authoritative tick '+state.tick);
  const before={stage:stage(state),cookingXp:cookingXp(state)};
  const bot=new BotActions(sdk);
  let actions=0;
  const recordAction=result=>{
   actions++;
   if(actions>50)throw new Error('quest_action_budget_exceeded');
   if(result?.success!==true||result.phase!=='completion'||result?.data?.verifiedEffect!==true)
    throw new Error('native_normal_game_action_unverified');
  };
  const outcome=await runCook({sdk,bot,quest:{id:'cook'},recordAction});
  const after=sdk.getState();
  console.log('COOK_QUEST_NATIVE_OUTCOME: '+JSON.stringify({
   before,after:{stage:stage(after),cookingXp:cookingXp(after)},
   validatedActions:actions,observed:outcome?.observed===true,
   blocked:outcome?.blocked===true,reason:outcome?.reason??null,
   fullQuestVerified:false,needed:['logout_relogin','quest_points_once','normal_client_confirmation']
  }));
 }finally{
  try{await sdk?.disconnect()}catch{}
  try{await gateway?.close()}catch{}
  try{native.close()}catch{}
  console.log('BOT_CONTROLLER_DISCONNECTED: existing game server and all other players untouched by this runner.');
 }
}
if(import.meta.main){
 try{await main()}
 catch(err){console.error('BLOCKED: '+String(err?.message??err).replace(/[\r\n]+/g,' ').slice(0,160));process.exitCode=1}
}
