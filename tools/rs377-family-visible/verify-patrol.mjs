#!/usr/bin/env node
/**
 * Read-only, post-disconnect position verifier for the existing Fedora
 * HarnessView1 native #377 family-world patrol.
 *
 * It never opens the game network, stops a process, writes a save or starts
 * a bot. A changed native save position is evidence of server persistence,
 * NOT proof of visual rendering, path travelled or full RS-SDK autonomy.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const BOT = 'HarnessView1';
const FIXED_PATH = path.join(os.homedir(),'dev/JoshRS/lostcity377/engine/data/players/main/harnessview1.sav');
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));

export function parseArgs(argv) {
  let mode = '--check', pid = null;
  const seen = new Set();
  for(let i=0;i<argv.length;i++){
    const token=argv[i];
    if(seen.has(token))throw Error('Repeated option: '+token);
    seen.add(token);
    if(token==='--check'||token==='--watch')mode=token;
    else if(token==='--pid'){
      const num=argv[++i];
      if(!/^[1-9][0-9]*$/.test(num||'')||!Number.isSafeInteger(Number(num)))
        throw Error('Provide the positive integer PID reported by pgrep');
      pid=Number(num);
    }else throw Error('Usage: node verify-patrol.mjs --pid PID --check|--watch');
  }
  if(pid===null)throw Error('Explicit --pid required; never guess a process');
  return {mode,pid};
}

export function patrolProcessSignature(argv) {
  if(!Array.isArray(argv)||!argv.some(arg=>/^(?:.*\\/)?node(?:js)?$/.test(arg)))
    return false;
  const pilot=argv.some(arg=>/(^|\\/)tools\\/rs377-family-visible\\/join\\.mjs$/.test(arg));
  const target=argv.indexOf('--bot');
  return pilot && target!==-1 && argv[target+1]===BOT &&
    argv.includes('--patrol') && argv.includes('--allow-family') &&
    argv.includes('--connect');
}

export function classify(x,z,level) {
  if(!Number.isInteger(x)||!Number.isInteger(z)||!Number.isInteger(level))
    return 'UNKNOWN';
  if(level===0&&x>=3210&&x<=3250&&z>=3190&&z<=3250)return 'LUMBRIDGE';
  if(x>=3050&&x<=3156&&z>=3050&&z<=3140)return 'TUTORIAL_ISLAND';
  return 'OTHER';
}

export function inspectNativeSave(bytes) {
  if(!Buffer.isBuffer(bytes)||bytes.length<9||bytes.subarray(0,2).toString('hex')!=='2004')
    throw Error('Unrecognised native 377 save; no conclusions');
  const x=bytes.readUInt16BE(4),z=bytes.readUInt16BE(6),level=bytes.readUInt8(8);
  return Object.freeze({x,z,level,region:classify(x,z,level)});
}

export function compareSnapshots(before,after){
  if(before.position.region!=='LUMBRIDGE')
    return {status:'UNVERIFIED',reason:'baseline_not_lumbridge'};
  if(after.position.region!=='LUMBRIDGE')
    return {status:'UNVERIFIED',reason:'final_position_outside_lumbridge'};
  if(after.mtimeMs<=before.mtimeMs)
    return {status:'UNVERIFIED',reason:'save_not_updated_after_baseline'};
  if(before.position.x===after.position.x&&before.position.z===after.position.z&&
     before.position.level===after.position.level)
    return {status:'UNVERIFIED',reason:'save_position_unchanged'};
  return {status:'PERSISTED_POSITION_CHANGED',
    before:before.position,after:after.position,
    note:'Server persisted a different Lumbridge position; this alone does not prove individual walking packets or SDK autonomy'};
}

export function readSnapshot(savePath=FIXED_PATH) {
  const stat=fs.lstatSync(savePath);
  if(!stat.isFile()||stat.isSymbolicLink())
    throw Error('Bot save is not a regular native file; refusing inspection');
  return {mtimeMs:stat.mtimeMs,position:inspectNativeSave(fs.readFileSync(savePath))};
}

export function inspectProcess(pid){
  try{
    const s=fs.readFileSync('/proc/'+pid+'/cmdline');
    if(!s.length)return false;
    return patrolProcessSignature(s.toString('utf8').split('\\0').filter(Boolean));
  }catch(error){
    if(error?.code==='ENOENT'||error?.code==='ESRCH')return false;
    throw error;
  }
}

export async function watch({pid,read=readSnapshot,active=inspectProcess,
  wait=sleep,limitMs=600000,now=Date.now,log=console.log}){
  if(!active(pid))return {status:'UNVERIFIED',reason:'controller_not_running_at_baseline'};
  const before=read();
  log('WATCH_BASELINE: '+JSON.stringify(before.position)+'; no game or save changes made.');
  const deadline=now()+limitMs;
  while(now()<deadline){
    if(!active(pid))break;
    await wait(1000);
  }
  if(active(pid))return {status:'UNVERIFIED',reason:'controller_still_running_after_watch_limit'};
  // The login thread may need a short grace period to persist the normal
  // account after the TCP session closes.
  let after=read();
  for(let n=0;n<20 && after.mtimeMs<=before.mtimeMs;n++){
    await wait(1000);
    after=read();
  }
  return compareSnapshots(before,after);
}

async function main(){
  try{
    const {mode,pid}=parseArgs(process.argv.slice(2));
    if(!inspectProcess(pid)){
      console.log('UNVERIFIED: PID '+pid+' is not a running HarnessView1 patrol.');
      return;
    }
    const baseline=readSnapshot();
    console.log('PATROL_ACTIVE: PID '+pid+'; saved position '+JSON.stringify(baseline.position));
    console.log('Note: this save may be stale while the bot is logged in.');
    if(mode==='--check')return;
    const result=await watch({pid});
    console.log('VERIFIER_RESULT: '+JSON.stringify(result));
  }catch(error){
    console.error('VERIFIER_BLOCKED: '+String(error?.message||error));
    process.exitCode=1;
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  await main();
