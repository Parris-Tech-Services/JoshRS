#!/usr/bin/env node
/**
 * A single ordinary #377 account on JoshRS' EXISTING family world.
 * This is a visible-player NETWORK PROOF, not an upstream RS-SDK agent:
 * no fabricated BotWorldState, client decode, automated quest actions or
 * verified visibility. Only normal login/keepalive/walk packets.
 *
 * Default has NO connection. Operator must select --connect --allow-family
 * and an explicit private IP. Never import account DB, modify the server,
 * open an inbound port, or touch Elrothiro/Sylvie's credentials.
 */
import {createPublicKey} from 'node:crypto';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {emitKeypressEvents} from 'node:readline';
import {Session377,checkTarget} from '../rs377-chatgpt-bridge/src/session.mjs';
import {readSnapshot,compareSnapshots} from './verify-patrol.mjs';

const MODULUS='7162900525229798032761816791230527296329313291232324290237849263501208207972894053929065636522363163621000728841182238772712427862772219676577293600221789';
const EXPONENT='58778699976184461502525193738213253649000149147835990136706041084440742975821';
const MAX_SECONDS=600;
const WAYPOINTS=Object.freeze([[3233,3217],[3231,3218],[3232,3220],[3234,3219]]);
const usage=()=>[
  'JoshRS: one visible normal #377 bot on the SAME running world.',
  'Read-only checks FIRST: node tools/rs377-net-doctor/doctor.mjs --host PRIVATE_IP --port 52402 --json',
  'Join: node tools/rs377-family-visible/join.mjs --connect --allow-family --host PRIVATE_IP --bot HarnessView1 --patrol',
  'From JParrisDesktop itself, --host 127.0.0.1 avoids cross-site routing.',
  'Password entered privately. Ctrl+C ends bot session. No quest automation/SDK state until observer is integrated.',
  'Flags: --port 52402 --web-port 8888 --seconds 120 (max 600) --patrol --verify-position (optional)'
].join('\n');

function decimalToB64url(n){
 let hex=BigInt(n).toString(16);
 if(hex.length%2)hex='0'+hex;
 return Buffer.from(hex,'hex').toString('base64url');
}
export function clientPublic377(){
 return createPublicKey({key:{kty:'RSA',n:decimalToB64url(MODULUS),
   e:decimalToB64url(EXPONENT)},format:'jwk'}).export({type:'spki',format:'pem'});
}
export function options(argv){
 const valid=new Set(['--connect','--allow-family','--host','--bot','--port','--web-port',
   '--seconds','--patrol','--verify-position','--help']);
 const data={connect:false,allowFamily:false,host:null,
   bot:'HarnessView1',port:52402,webPort:8888,seconds:120,patrol:false,verifyPosition:false,help:false};
 for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(!valid.has(arg))throw new Error('Unknown argument: '+arg);
  if(['--connect','--allow-family','--patrol','--verify-position','--help'].includes(arg)){
   const key={'--connect':'connect','--allow-family':'allowFamily',
     '--patrol':'patrol','--verify-position':'verifyPosition','--help':'help'}[arg];data[key]=true;continue;
  }
  const value=argv[++i];if(!value||value.startsWith('--'))throw new Error('Missing '+arg);
  const key={'--host':'host','--bot':'bot','--port':'port',
    '--web-port':'webPort','--seconds':'seconds'}[arg];
  if(['--port','--web-port','--seconds'].includes(arg)){
   if(!/^[0-9]+$/.test(value))throw new Error('Invalid number for '+arg);
   data[key]=Number(value);
  }else data[key]=value;
 }
 if(data.help)return data;
 if(data.verifyPosition&&!data.patrol)throw new Error('--verify-position requires --patrol');
 if(!data.connect||!data.allowFamily)throw new Error('Explicit --connect --allow-family required; no automatic login');
 if(!data.host)throw new Error('Explicit --host private IP required (never guess the family world)');
 if(!net.isIP(data.host))throw new Error('Host must be a numeric private IP, not unverified DNS');
 checkTarget({host:data.host,port:data.port,mode:'family',approvedFamily:true});
 if(!Number.isSafeInteger(data.webPort)||data.webPort<1024||data.webPort>65535||
    data.webPort===data.port)throw new Error('Invalid web port');
 if(!Number.isSafeInteger(data.seconds)||data.seconds<15||data.seconds>MAX_SECONDS)
  throw new Error('Duration must be 15–600 seconds; rerun to continue');
 if(!/^Harness[A-Za-z0-9_-]{1,5}$/.test(data.bot)||data.bot.length>12)
  throw new Error('Use a separate bot named Harness<up to 5 characters>, max 12 letters');
 return data;
}
export async function fetchCrc37(host,webPort,{fetchImpl=fetch}={}){
 // Defence in depth: reject public hosts and unsupported web ports even if
 // this helper is invoked outside the validated CLI.
 checkTarget({host,port:52402,mode:'family',approvedFamily:true});
 if(!Number.isSafeInteger(webPort)||webPort<1024||webPort>65535)
  throw new Error('Invalid CRC web port');
 const response=await fetchImpl('http://'+host+':'+webPort+'/crc0',{
  signal:AbortSignal.timeout(4500),redirect:'error',cache:'no-store'});
 if(!response.ok)throw new Error('JoshRS CRC endpoint returned HTTP '+response.status);
 if(Number(response.headers.get('content-length')??40)>40)
  throw new Error('Unexpected large revision-377 CRC response');
 const buf=Buffer.from(await response.arrayBuffer());
 if(buf.length!==40)throw new Error('Expected pinned 377 40-byte CRC0 response, got '+buf.length);
 return buf.subarray(0,36);
}
export async function secretFromTerminal(input=process.stdin,output=process.stderr){
 if(!input.isTTY||!output.isTTY)throw new Error('Private interactive terminal required for bot password');
 output.write('Separate bot account password (hidden, 1–20 ASCII characters): ');
 emitKeypressEvents(input);
 const oldRaw=input.isRaw===true;
 input.setRawMode(true);input.resume();
 let password='';
 return await new Promise((resolve,reject)=>{
  function finish(error){
   input.removeListener('keypress',onKey);
   input.setRawMode(oldRaw);input.pause();output.write('\n');
   if(error)reject(error);else resolve(password);
  }
  function onKey(char,key){
   if(key?.ctrl&&key?.name==='c'){finish(new Error('Cancelled before login'));return}
   if(key?.name==='return'||key?.name==='enter'){
    if(password.length<1)finish(new Error('Empty password refused'));
    else finish(null);return;
   }
   if(key?.name==='backspace'){password=password.slice(0,-1);return}
   if(typeof char==='string'&&/^[\x20-\x7e]$/.test(char)){
    if(password.length<20)password+=char;
   }
  }
  input.on('keypress',onKey);
 });
}
export async function join(options, {Session=Session377,loadCrc=fetchCrc37,
  getPassword=secretFromTerminal,log=console.log}={}){
 const crc=await loadCrc(options.host,options.webPort);
 const before=options.verifyPosition ? readSnapshot() : null;
 if(before && before.position.region!=='LUMBRIDGE')
  throw new Error('Bot saved outside Lumbridge; refusing blind patrol verification');
 const password=await getPassword();
 const session=new Session({target:{host:options.host,port:options.port,
   mode:'family',approvedFamily:true},username:options.bot,password,
   publicKeyPem:clientPublic377(),crcs:crc,timeoutMs:8500});
 let active=true;
 let keepalive=null,patrol=null,deadline=null,index=0,actions=0;
 try{
  const result=await session.connect();
  if(result?.authenticated!==true||session.status().authenticated!==true)
   throw new Error('Normal 377 game login did not authenticate');
  log('LOGIN_AUTHENTICATED (normal 377 account, NOT a proven visible player).');
  log('Bot '+options.bot+' joined TCP world '+options.host+':'+options.port+
      '. Check the real game client nearby; server/world identity still requires visual evidence.');
  if(options.patrol)log('Patrolling safe Lumbridge waypoints only. Go to Lumbridge near 3233,3218 to look for the character.');
  const done=new Promise(resolve=>{
   keepalive=setInterval(()=>{
    try{
     if(!active||!session.status().authenticated)throw new Error('connection_closed');
     session.send({type:'keepalive'});
    }catch{active=false;resolve('CONNECTION_LOST')}
   },3000);
   if(options.patrol)patrol=setInterval(()=>{
    try{
     if(!active||!session.status().authenticated)throw new Error('connection_closed');
     const [x,z]=WAYPOINTS[index++%WAYPOINTS.length];
     const effect=session.send({type:'walk',x,z,running:false});
     actions++;
     log('Walk requested to '+x+','+z+' — '+effect.status+
       ' (NOT proof the character reached that tile).');
    }catch{active=false;resolve('CONNECTION_LOST')}
   },5500);
   deadline=setTimeout(()=>{active=false;resolve('DURATION_FINISHED')},options.seconds*1000);
   process.once('SIGINT',()=>{active=false;resolve('STOPPED_BY_USER')});
  });
  const end=await done;
  log(end+'; normal walk requests: '+actions+'; actual world rendering NOT VERIFIED.');
  return {status:end,authenticated:true,walkRequests:actions,
    sameWorldVisuallyVerified:false,fullRsSdkAgent:false,questPlaythroughVerified:false};
 }finally{
  active=false;
  if(keepalive)clearInterval(keepalive);
  if(patrol)clearInterval(patrol);
  if(deadline)clearTimeout(deadline);
  session.close();
  if(before) {
   let after;
   try {
    for(let attempt=0;attempt<15;attempt++){
     await new Promise(resolve=>setTimeout(resolve,750));
     after=readSnapshot();
     if(after.mtimeMs>before.mtimeMs)break;
    }
    log('POSITION_PROOF: '+JSON.stringify(compareSnapshots(before,after)));
   }catch(error){
    log('POSITION_PROOF_UNVERIFIED: '+String(error?.message??error));
   }
  }
 }
}
async function main(){
 let opts;
 try{
  opts=options(process.argv.slice(2));
  if(opts.help){console.log(usage());return}
  console.log('Connecting one new normal bot account. Existing accounts and server configuration will NOT be modified.');
  console.log('This is a native network-visible character trial, NOT RS-SDK quest autonomy.');
  const result=await join(opts);
  if(!result.authenticated)process.exitCode=1;
 }catch(err){
  console.error('JOIN_BLOCKED: '+String(err?.message??err).replace(/[\r\n]/g,' ').slice(0,180));
  process.exitCode=1;
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))
 await main();
