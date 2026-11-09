/**
 * A SINGLE real, normal #377 HarnessView1 session owned by the upstream
 * RS-SDK MCP process. No second client or separate quest-controller service.
 * No engine start/stop/save writes. Default import makes no connections.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createPublicKey,randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {Session377} from '../rs377-chatgpt-bridge/src/session.mjs';
import {createEngine377Observer} from '../rs377-chatgpt-bridge/src/engine-observer.mjs';
import {createSdk377Runtime} from '../rs377-chatgpt-bridge/src/sdk-runtime.mjs';
import {createSdk377WebSocket} from '../rs377-chatgpt-bridge/src/sdk-websocket.mjs';
import {BOT,WORLD,PIN,SDK_DIR,ROOT,readSecrets,verifyApproval,ensureRegularUser} from './mcp-private.mjs';

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const GAME_PORT=52402,HTTP_PORT=8888,MANAGEMENT_PORT=8898,GATEWAY_PORT=18883;
function assertPinnedSdk() {
 if(!fs.existsSync(path.join(SDK_DIR,'.git')))throw new Error('install_pinned_original_RS_SDK_first');
 const actual=execFileSync('git',['-C',SDK_DIR,'rev-parse','HEAD'],{encoding:'utf8',timeout:7000}).trim();
 if(actual!==PIN)throw new Error('original_RS_SDK_commit_changed');
 if(execFileSync('git',['-C',SDK_DIR,'status','--porcelain','--untracked-files=no'],
   {encoding:'utf8',timeout:7000}).trim())
  throw new Error('pinned_RS_SDK_tracked_files_modified');
}
function ensureWorld(){
 ensureRegularUser();
 verifyApproval();
 if(process.env.RS377_FAMILY_SERVER_INSTRUMENTED!=='true')
  throw new Error('no_confirmed_live_family_observer');
 const osRelease=fs.readFileSync('/etc/os-release','utf8');
 if(!/^ID=["']?fedora\b/m.test(osRelease))throw new Error('Fedora_host_required');
 assertPinnedSdk();
 const privateKey=path.join(ROOT,'engine/data/config/private.pem');
 if(!fs.statSync(privateKey).isFile())throw new Error('real_server_private_key_unavailable');
 return privateKey;
}
async function loadCrc(){
 const res=await fetch('http://127.0.0.1:'+HTTP_PORT+'/crc0',
  {signal:AbortSignal.timeout(4000),redirect:'error'});
 if(!res.ok)throw new Error('real_377_cache_crc_unavailable');
 const body=Buffer.from(await res.arrayBuffer());
 if(body.length!==40)throw new Error('real_377_cache_crc_bad_length');
 return Buffer.from(body.subarray(0,36));
}
async function connectLive(){
 const privateKey=ensureWorld();
 const {observerToken,botPassword}=readSecrets();
 const publicKeyPem=createPublicKey(fs.readFileSync(privateKey,'utf8')).export({format:'pem',type:'spki'});
 const crcs=await loadCrc();
 const native=new Session377({
  target:{host:'127.0.0.1',port:GAME_PORT,mode:'family',approvedFamily:true},
  username:BOT,password:botPassword,publicKeyPem,crcs,timeoutMs:9000
 });
 let gateway=null,sdk=null;
 const cleanup=async()=>{
  try{await sdk?.disconnect()}catch{}
  try{await gateway?.close()}catch{}
  try{native.close()}catch{}
 };
 try{
  await native.connect();
  if(!native.status().authenticated||native.status().mode!=='family')
   throw new Error('normal_family_bot_authentication_failed');
  const observer=()=>createEngine377Observer({
   port:MANAGEMENT_PORT,token:observerToken,botName:BOT,
   expectedWorld:WORLD,approvedFamily:true
  });
  const primary=observer();
  let observed=null;
  // Read-only retry: the real game may not have finished loading the bot
  // immediately after successful normal TCP login.
  for(let n=0;n<20;n++){
   try{observed=await primary.observe();break}
   catch(err){
    if(!/replayed_native_observation|native_observer_http_409/.test(String(err?.message??'')))throw err;
    await delay(650);
   }
  }
  if(!observed||observed.player?.username!==BOT||observed.world?.instanceId!==WORLD)
   throw new Error('authoritative_family_bot_observation_missing');
  const token=randomBytes(32).toString('hex');
  const runtime=createSdk377Runtime({session:native,observer:observer(),botName:BOT,
   expectedWorld:WORLD,approvedFamily:true});
  gateway=createSdk377WebSocket({runtime,botName:BOT,token});
  await gateway.listen(GATEWAY_PORT);
  const {BotSDK}=await import(pathToFileURL(path.join(SDK_DIR,'sdk/index.ts')).href);
  const {BotActions}=await import(pathToFileURL(path.join(SDK_DIR,'sdk/actions.ts')).href);
  sdk=new BotSDK({botUsername:BOT,password:token,
   gatewayUrl:'ws://127.0.0.1:'+GATEWAY_PORT+'/gateway',
   autoLaunchBrowser:false,autoReconnect:false,showChat:false,
   connectionMode:'control',readyTimeout:0,connectTimeout:9000,actionTimeout:11000});
  await sdk.connect();
  if(!sdk.isAuthenticated())throw new Error('RS_SDK_gateway_not_authenticated');
  let state=null;
  for(let i=0;i<45;i++){
   state=sdk.getState();
   if(state?.inGame&&state?.player?.name===BOT&&Number.isSafeInteger(state.tick))break;
   await delay(200);
  }
  if(!state?.inGame||state.player?.name!==BOT)
   throw new Error('verified_RS_SDK_world_state_unavailable');
  return {sdk,bot:new BotActions(sdk),native,gateway,cleanup};
 }catch(e){await cleanup();throw e}
}
/**
 * All MCP tools must use this manager. It refuses any bot except HarnessView1,
 * never reuses a stale Session377, and never reconnects in the background.
 */
export function createBotOnlyManager(start=connectLive) {
 let active=null;
 let connecting=null;
 return Object.freeze({
  get(name){
   if(name!==BOT||!active?.sdk?.isConnected?.()||!active?.native?.status?.().authenticated)return undefined;
   return active.record;
  },
  async connect(name) {
   if(name!==BOT)throw new Error('only_HarnessView1_may_be_controlled');
   if(active?.record?.connected&&active.sdk?.isConnected?.()&&
      active.native?.status?.().authenticated)return active.record;
   if(connecting)return connecting;
   connecting=(async()=>{
    if(active) {await active.cleanup();active=null}
    const session=await start();
    if(!session?.sdk||!session?.bot||!session?.native||!session?.cleanup)
     throw new Error('normal_authenticated_bot_connection_required');
    const record={name:BOT,username:BOT,connected:true,lastShownMessageTick:-1,
      sdk:session.sdk,bot:session.bot};
    active={...session,record};
    return record;
   })();
   try{return await connecting}finally{connecting=null}
  },
  list() {
   const c=this.get(BOT);
   return c?[{name:BOT,username:BOT,connected:true}]:[];
  },
  async disconnect(name){
   if(name!==BOT)throw new Error('only_HarnessView1_may_be_controlled');
   if(connecting)await connecting.catch(()=>{});
   if(!active) return;
   const toClose=active;active=null;toClose.record.connected=false;
   await toClose.cleanup();
  },
  async close(){await this.disconnect(BOT)}
 });
}
