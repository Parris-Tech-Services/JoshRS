#!/usr/bin/env node
/**
 * Fedora JoshRS #377 family-world VISIBILITY pilot.
 *
 * A separate ordinary HarnessScout account walks through native 377 packets,
 * without touching the server process, game source, config or any other save.
 * It uses the same authenticated protocol library as the isolated RS-SDK bridge.
 *
 * NOT the unmodified upstream BotSDK, NOT autonomous questing, and NOT proof
 * that movement occurred until a human player actually sees it in-game.
 *
 * Run only after the user has launched and logged into their own JoshRS world.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createPublicKey} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Session377} from '../rs377-chatgpt-bridge/src/session.mjs';

const BOT = 'HarnessScout';
const HOST = '127.0.0.1';
const PORT = 52402;
const WEB_PORT = 8888;
export const WAYPOINTS = Object.freeze([
  Object.freeze({x:3222,z:3218}),
  Object.freeze({x:3225,z:3218}),
  Object.freeze({x:3227,z:3220}),
  Object.freeze({x:3223,z:3220})
]);

export function validatePilot({mode,approval,name=BOT,password}={}) {
  if(!['--check','--run'].includes(mode))throw new Error('Usage: node pilot.mjs --check|--run');
  if(name!==BOT)throw new Error('Only dedicated HarnessScout identity permitted');
  if(mode==='--run' && approval!=='YES')
    throw new Error('Run requires JOSHRS_FAMILY_PILOT_APPROVED=YES');
  if(mode==='--run' && (typeof password!=='string'||password.length<1||password.length>20))
    throw new Error('Provide a 1..20 character bot-only password using JOSHRS_BOT_PASSWORD');
  return true;
}

export function checkFiles(install) {
  const root=path.resolve(install);
  const engine=path.join(root,'engine');
  const player=path.join(engine,'data','players','main','elrothiro.sav');
  const key=path.join(engine,'data','config','private.pem');
  const game=fs.statSync(player,{throwIfNoEntry:false});
  if(!game?.isFile()||game.size===0)
    throw new Error('Elrothiro save missing: refusing to run against an unidentified world');
  if(!fs.statSync(key,{throwIfNoEntry:false})?.isFile())
    throw new Error('Engine RSA key missing: refusing bot login');
  return {engine,key};
}

export async function getCrc(fetcher=fetch) {
  for(const suffix of ['/crc0','/crc']) {
    try {
      const reply=await fetcher('http://127.0.0.1:'+WEB_PORT+suffix,
        {signal:AbortSignal.timeout(2500)});
      if(!reply.ok)continue;
      const buffer=Buffer.from(await reply.arrayBuffer());
      if(buffer.length>=36&&buffer.length<1024)return buffer.subarray(0,36);
    }catch{}
  }
  throw new Error('Active JoshRS web port 8888 did not supply authentic 36-byte cache CRCs');
}

export async function runPilot({install,password,fetcher=fetch,Session=Session377}={}) {
  validatePilot({mode:'--run',approval:process.env.JOSHRS_FAMILY_PILOT_APPROVED,password});
  const {key}=checkFiles(install);
  const crcs=await getCrc(fetcher);
  // Derive the public half locally. The RSA private key never leaves this PC.
  const publicKeyPem=createPublicKey(fs.readFileSync(key,'utf8'))
    .export({type:'spki',format:'pem'});
  const session=new Session({
    target:{host:HOST,port:PORT,mode:'family',approvedFamily:true},
    username:BOT,password,publicKeyPem,crcs,timeoutMs:8000
  });
  await session.connect();
  console.log('NORMAL_BOT_CONNECTED: HarnessScout authenticated in the running family world.');
  console.log('This is normal 377 movement, not yet full autonomous RS-SDK control.');
  console.log('In Elrothiro, add HarnessScout to Friends and look around Lumbridge.');
  console.log('Press Ctrl+C in this terminal to disconnect the bot without stopping JoshRS.');
  let stopped=false, next=0;
  const handles=[];
  function stop(reason){
    if(stopped)return;
    stopped=true;
    for(const handle of handles)clearInterval(handle);
    session.close();
    console.log('Pilot ended: '+reason+' (bot save/relog not yet independently verified)');
  }
  const safely=(action)=>{
    if(stopped)return;
    try{return session.send(action)}
    catch(e){stop('connection lost: '+e.message)}
  };
  handles.push(setInterval(()=>safely({type:'keepalive'}),3000));
  handles.push(setInterval(()=>{
    const tile=WAYPOINTS[next++%WAYPOINTS.length];
    const result=safely({type:'walk',x:tile.x,z:tile.z,running:false});
    if(result)console.log('Walk packet sent toward '+tile.x+','+tile.z+
      ' ('+result.status+'; verify visually)');
  },5500));
  session.socket?.on('close',()=>stop('server closed the bot session'));
  process.once('SIGINT',()=>stop('operator Ctrl+C'));
  process.once('SIGTERM',()=>stop('operator stop'));
  return {session,stop};
}

async function main(){
  const mode=process.argv[2]??'--check';
  const install=process.env.JOSHRS_FEDORA_INSTALL||
    path.join(os.homedir(),'dev','JoshRS','lostcity377');
  try {
    validatePilot({mode,approval:process.env.JOSHRS_FAMILY_PILOT_APPROVED,
      password:process.env.JOSHRS_BOT_PASSWORD});
    checkFiles(install);
    if(mode==='--check'){
      console.log('PREFLIGHT_OK: Elrothiro save and engine key present; no network or game changes.');
      console.log('Next: run --run with explicit approval and a bot-only password.');
      return;
    }
    const password=process.env.JOSHRS_BOT_PASSWORD;
    delete process.env.JOSHRS_BOT_PASSWORD;
    await runPilot({install,password});
  }catch(e){
    console.error('PILOT_BLOCKED: '+e.message);
    process.exitCode=1;
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await main();
}
