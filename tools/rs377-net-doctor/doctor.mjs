#!/usr/bin/env node
/**
 * JoshRS #377 private-network connectivity doctor (ChatGPT task 14).
 * OUTBOUND ONLY. No credentials, login packet, process restart or save access.
 * --handshake sends exactly two bytes [14,0] and never authenticates.
 */
import dns from 'node:dns/promises';
import net from 'node:net';
import os from 'node:os';
import {pathToFileURL} from 'node:url';

export const HELLO_377=Buffer.from([14,0]);
function privateV4(ip){
 const p=ip.split('.').map(Number);
 if(p.length!==4||p.some(n=>!Number.isInteger(n)||n<0||n>255))return false;
 return p[0]===10||p[0]===127||(p[0]===172&&p[1]>=16&&p[1]<=31)
  ||(p[0]===192&&p[1]===168)||(p[0]===100&&p[1]>=64&&p[1]<=127)
  ||(p[0]===169&&p[1]===254);
}
export function isPrivateAddress(ip){
 const type=net.isIP(ip);
 if(type===4)return privateV4(ip);
 if(type!==6)return false;
 const s=ip.toLowerCase().split('%')[0];
 if(s==='::1')return true;
 if(s.startsWith('::ffff:'))return privateV4(s.slice(7));
 const first=Number.parseInt(s.split(':')[0],16);
 return Number.isInteger(first)&&((first&0xfe00)===0xfc00||(first&0xffc0)===0xfe80);
}
export function parseOptions(args){
 const options={host:null,port:52402,timeoutMs:1800,handshake:false,json:false,help:false};
 for(let i=0;i<args.length;i++){
  const k=args[i];
  if(k==='--help'||k==='-h'){options.help=true;continue;}
  if(k==='--handshake'){options.handshake=true;continue;}
  if(k==='--json'){options.json=true;continue;}
  if(!['--host','--port','--timeout-ms'].includes(k))throw Error('Unknown argument: '+k);
  const val=args[++i];
  if(val===undefined||val.startsWith('--'))throw Error('Missing value for '+k);
  if(k==='--host')options.host=val;
  else{
   if(!/^\d+$/.test(val)||!Number.isSafeInteger(Number(val)))throw Error('Invalid integer for '+k);
   if(k==='--port')options.port=Number(val);
   else options.timeoutMs=Number(val);
  }
 }
 if(!options.help){
  const h=options.host;
  if(!h||h.length>253||/[\s/@?#\\]/.test(h)||
   (!net.isIP(h)&&!/^[a-z0-9_-]+(?:\.[a-z0-9_-]+)*\.?$/i.test(h)))
   throw Error('A plain --host DNS name or IP address is required (not a URL)');
  if(options.port<1||options.port>65535)throw Error('--port must be 1..65535');
  if(options.timeoutMs<250||options.timeoutMs>5000)throw Error('--timeout-ms must be 250..5000');
 }
 return options;
}
export function localInterfaces(){
 const names=Object.keys(os.networkInterfaces());
 return {tailscaleInterfaceDetected:names.some(n=>/tailscale|^ts\d+$/i.test(n)),
  note:'Local interface names only; Tailscale peer reachability and world identity remain unknown'};
}
export function probeTcp(address,port,timeoutMs,handshake=false){
 return new Promise(resolve=>{
  const socket=new net.Socket();let settled=false,connected=false,received=Buffer.alloc(0),error=null;
  const started=process.hrtime.bigint();
  function finish(){
   if(settled)return;settled=true;
   const elapsedMs=Math.round(Number(process.hrtime.bigint()-started)/1e6);
   socket.destroy();
   resolve({connected,elapsedMs,helloBytesReceived:handshake?received.length:0,
    helloStatus:!handshake?'NOT_RUN':!connected?'NOT_RUN':received.length>=17?
     'RESPONSE_OBSERVED_UNVERIFIED':received.length?'INCOMPLETE':'NO_RESPONSE',
    error:error?(error.code||'NETWORK_ERROR'):null});
  }
  socket.setTimeout(timeoutMs,()=>{error={code:'TIMEOUT'};finish();});
  socket.once('connect',()=>{connected=true;if(handshake)socket.write(HELLO_377);else finish();});
  socket.on('data',chunk=>{
   if(!handshake)return;
   received=Buffer.concat([received,chunk]).subarray(0,17);
   if(received.length>=17)finish();
  });
  socket.once('error',e=>{error=e;finish();});
  socket.once('close',finish);
  // Connect to PINNED IP, not hostname: prevent rebinding during connect.
  socket.connect({host:address,port,family:net.isIP(address)});
 });
}
export async function diagnose(opts,resolveDns=dns.lookup){
 const result={
  tool:'joshrs-377-private-net-doctor',mode:opts.handshake?'opt_in_hello_only':'tcp_only',
  target:{host:opts.host,port:opts.port},
  safety:{noListen:true,privateAddressRequired:true,noCredentials:true,noPlayerLogin:true,noGameStateChange:true},
  local:localInterfaces(),
  checks:{dns:{status:'UNKNOWN'},privateRoute:{status:'NOT_PROVEN'},tcp:{status:'NOT_RUN'},
   handshake377:{status:opts.handshake?'NOT_RUN':'SKIPPED'},
   worldIdentity:{status:'UNVERIFIED',reason:'TCP and hello are not a trusted world fingerprint'},
   actualPlayerLogin:{status:'NOT_TESTED',reason:'No authentication or account access'},
   sameWorldAsElrothiro:{status:'UNVERIFIED'}},
  next:'Only authorised local evidence of server identity, disposable login and two-client gameplay can prove same-world playability.'
 };
 let records;
 try{
  records=net.isIP(opts.host)?[{address:opts.host,family:net.isIP(opts.host)}]:
   await resolveDns(opts.host,{all:true,verbatim:true});
  if(!records?.length)throw {code:'ENODATA'};
  result.checks.dns={status:'RESOLVED',addressCount:records.length};
 }catch(e){result.checks.dns={status:'FAILED',error:e.code||'RESOLUTION_FAILED'};return result;}
 const allowed=records.filter(r=>isPrivateAddress(r.address));
 if(!allowed.length){
  result.checks.privateRoute={status:'BLOCKED_PUBLIC_TARGET',reason:'No private address; no socket opened'};
  return result;
 }
 const selected=allowed.find(r=>r.family===4)||allowed[0];
 result.checks.privateRoute={status:'PRIVATE_TARGET_SELECTED',address:selected.address,
  note:'Private-range address only; route and peer identity are unverified'};
 const outcome=await probeTcp(selected.address,opts.port,opts.timeoutMs,opts.handshake);
 result.checks.tcp={status:outcome.connected?'CONNECTED':'FAILED',elapsedMs:outcome.elapsedMs,
  ...(outcome.error?{error:outcome.error}:{})};
 if(opts.handshake)result.checks.handshake377={
  status:outcome.helloStatus,bytesReceived:outcome.helloBytesReceived,
  note:'Only two-byte [14,0] hello; a 17-byte response does not prove revision, world or login'};
 return result;
}
export const HELP=[
 'JoshRS #377 private-network doctor (Node 20+; no accounts)',
 'Usage: node doctor.mjs --host <private-IP-or-DNS> [--port 52402] [--timeout-ms 1800] [--handshake] [--json]',
 'Default: DNS + outbound TCP connect; --handshake sends ONLY [14,0] and closes.',
 'Never logs in, sends credentials, changes server settings or opens listeners.',
 'World identity and player login remain unverified even if TCP and hello succeed.'
].join('\n')+'\n';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const opts=parseOptions(process.argv.slice(2));
  if(opts.help)process.stdout.write(HELP);
  else{
   const r=await diagnose(opts);
   if(opts.json)process.stdout.write(JSON.stringify(r,null,2)+'\n');
   else{
    process.stdout.write('JoshRS 377 private network doctor: '+r.target.host+':'+r.target.port+'\n');
    for(const [key,check]of Object.entries(r.checks))
     process.stdout.write(key+': '+check.status+(check.error?' ('+check.error+')':'')+'\n');
    process.stdout.write('Next: '+r.next+'\n');
   }
  }
 }catch(e){process.stderr.write('BLOCKED: '+e.message+'\n');process.exitCode=2;}
}
