/**
 * Genuine normal-network revision-377 transport for disposable isolated
 * AgentFleet profiles. NO direct game state writes. Never production/family.
 *
 * Runtime files and private RSA material are only read on the SAME machine;
 * we derive the public key in memory and never copy, log or upload secrets.
 */
import {readFile,realpath} from 'node:fs/promises';
import {join,sep} from 'node:path';
import {createPublicKey} from 'node:crypto';
import {Session377} from '../rs377-chatgpt-bridge/src/session.mjs';
import {createEngine377Observer} from '../rs377-chatgpt-bridge/src/engine-observer.mjs';
import {createSdk377Runtime} from '../rs377-chatgpt-bridge/src/sdk-runtime.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const val=(env,k)=>{
 const v=env[k];
 if(typeof v!=='string'||v.length===0)throw new Error('missing_isolated_env_'+k);
 return v;
};
export function parseEnvFile(source){
 const env={};
 for(const line of source.split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z][A-Z0-9_]*)=(.*)$/);
  if(!m)continue;
  const key=m[1],raw=m[2].trim();
  if(Object.hasOwn(env,key))throw new Error('duplicate_env_key_'+key);
  env[key]=raw.startsWith('"')&&raw.endsWith('"')?raw.slice(1,-1):raw;
 }
 return env;
}
export function requireIsolatedConfig(config,{name}={}){
 const e=config.env;
 if(e.RS377_OBSERVER_ENABLED!=='true'||e.RS377_OBSERVER_ISOLATED!=='true'||
    e.NODE_XPRATE!=='1'||!['joshrs_ci_377'].includes(e.NODE_PROFILE)&&
      !/^isolated[-_][A-Za-z0-9_-]+$/.test(e.NODE_PROFILE??''))
  throw new Error('not_isolated_observer_world_no_family_changes');
 const bots=(e.RS377_OBSERVER_BOTS??e.RS377_OBSERVER_BOT??'')
  .split(',').map(s=>s.trim()).filter(Boolean);
 if(bots.length<1||bots.length>4||!bots.includes(name)||
    bots.some(n=>!/^Harness[A-Za-z0-9_-]{1,10}$/.test(n))||
    new Set(bots.map(n=>n.toLowerCase())).size!==bots.length)
  throw new Error('not_allowlisted_disposable_bot');
 if(!/^isolated-[a-z0-9_-]{4,64}$/i.test(val(e,'RS377_OBSERVER_WORLD'))||
    !/^[a-f0-9]{40}$/i.test(val(e,'RS377_OBSERVER_SOURCE_SHA'))||
    Buffer.byteLength(val(e,'RS377_OBSERVER_TOKEN'))<32)
  throw new Error('isolated_observer_identity_invalid');
 const port=Number(config.gamePort),webPort=Number(config.webPort);
 const managementPort=Number(e.WEB_MANAGEMENT_PORT);
 if(!Number.isInteger(port)||port<1024||port>65535||
    [52402,43500,45099].includes(port)||
    !Number.isInteger(webPort)||webPort<1024||webPort>65535||
    !Number.isInteger(managementPort)||managementPort<1024||managementPort>65535||
    managementPort===port||webPort===port||webPort===managementPort)
  throw new Error('isolated_ports_required');
 return Object.freeze({
  port,webPort,managementPort,
  token:e.RS377_OBSERVER_TOKEN,
  world:e.RS377_OBSERVER_WORLD,
  sourceSha:e.RS377_OBSERVER_SOURCE_SHA
 });
}
export async function inspectNativeWindowsRuntime(repoRoot){
 if(typeof repoRoot!=='string'||!repoRoot)throw new Error('explicit_repository_root_required');
 const runtime=await realpath(join(repoRoot,'runtime','jparris-377'));
 const activeText=await readFile(join(runtime,'active.json'),'utf8');
 const active=JSON.parse(activeText.replace(/^\uFEFF/,''));
 if(typeof active.engine!=='string')throw new Error('active_engine_missing');
 const engine=await realpath(active.engine);
 if(!engine.toLowerCase().startsWith((runtime+sep).toLowerCase()))
  throw new Error('active_engine_outside_private_runtime');
 const env=parseEnvFile(await readFile(join(engine,'.env'),'utf8'));
 return {runtime,engine,gamePort:Number(active.gamePort??env.NODE_PORT),
  webPort:Number(active.webPort??env.WEB_PORT),env};
}
export function createLocalNativeAgentFactory({repoRoot}={}){
 if(typeof repoRoot!=='string'||!repoRoot)throw new Error('repo_root_required');
 return async({name,password})=>{
  const active=await inspectNativeWindowsRuntime(repoRoot);
  const cfg=requireIsolatedConfig(active,{name});
  // No server restart or edits; only an ordinary disposable-client login.
  // Public RSA is derived in memory from the engine's local key, not sent to
  // GitHub and not exposed to JavaScript in the browser manager interface.
  const pem=await readFile(join(active.engine,'data','config','private.pem'),'utf8');
  const publicKeyPem=createPublicKey(pem).export({type:'spki',format:'pem'});
  const crc=await fetch('http://127.0.0.1:'+cfg.webPort+'/crc0',{
    signal:AbortSignal.timeout(3000),redirect:'error'
  });
  if(!crc.ok)throw new Error('native_crc_endpoint_unavailable');
  const bytes=Buffer.from(await crc.arrayBuffer());
  if(bytes.length!==40)throw new Error('native_377_crc_length_mismatch');
  const session=new Session377({
   target:{host:'127.0.0.1',port:cfg.port,mode:'isolated'},
   username:name,password,publicKeyPem,crcs:bytes.subarray(0,36),
   timeoutMs:9000
  });
  const observer=createEngine377Observer({
   port:cfg.managementPort,token:cfg.token,botName:name,expectedWorld:cfg.world
  });
  const sdk=createSdk377Runtime({session,observer,botName:name,expectedWorld:cfg.world});
  let authenticated=false;
  return Object.freeze({
   async connect(){
    const result=await session.connect();
    if(!result.authenticated)throw new Error('native_377_account_login_failed');
    authenticated=true;
   },
   async observe(){
    if(!authenticated||!session.status().authenticated)
      throw new Error('native_377_session_disconnected');
    for(let i=0;i<9;i++){
     try{return await sdk.observe()}
     catch(e){
      if(i<8&&/native_observer_http_409|replayed_native_observation/.test(e.message)){
       await sleep(700);continue;
      }
      throw e;
     }
    }
    throw new Error('native_observer_not_ready');
   },
   async move({x,z}){
    if(!authenticated)throw new Error('native_377_account_not_authenticated');
    // A typed SDK walk action becomes actual rev377 ISAAC TCP input.
    // The Fleet separately waits for the native observer to VERIFY position.
    return await sdk.action({type:'walkTo',x,z,running:false,reason:'Agent Manager exploration'});
   },
   async close(){authenticated=false;return session.close()}
  });
 };
}
