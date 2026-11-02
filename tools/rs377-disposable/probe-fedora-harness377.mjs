#!/usr/bin/env node
/**
 * A disposable Fedora-only #377 normal TCP login, short normal walk, and
 * independent authoritative SAVEFILE comparison. NOT an in-memory SDK observer.
 *
 * Run from a downloaded copy anywhere; uses audited bridge Session377 in the
 * separately checked-out JoshRS-source. Never touches family account data.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,createPublicKey,randomBytes} from 'node:crypto';
import {crc32} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const SKILLS=Object.freeze([
 'Attack','Defence','Strength','Hitpoints','Ranged','Prayer','Magic',
 'Cooking','Woodcutting','Fletching','Fishing','Firemaking','Crafting',
 'Smithing','Mining','Herblore','Agility','Thieving','Slayer','Farming','Runecraft'
]);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fail=message=>{throw new Error('BLOCKED: '+message)};
function verifySaveSnapshot(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<140)fail('missing/short 377 player save');
 const magic=bytes.readUInt16BE(0),version=bytes.readUInt16BE(2);
 if(magic!==0x2004||version!==7)fail('unexpected player save magic/version');
 const expected=bytes.readUInt32BE(bytes.length-4);
 const actual=crc32(bytes.subarray(0,bytes.length-4))>>>0;
 if(expected!==actual)fail('player save CRC mismatch; refusing to use partial/corrupt data');
 const position={x:bytes.readUInt16BE(4),z:bytes.readUInt16BE(6),plane:bytes.readUInt8(8)};
 if(position.x>16383||position.z>16383||position.plane>3)fail('invalid saved player coordinates');
 let offset=28;
 const skills=SKILLS.map(name=>{
  if(offset+5>bytes.length-4)fail('save file truncated in skills');
  const xpTenths=bytes.readInt32BE(offset),level=bytes.readUInt8(offset+4);
  offset+=5;
  if(xpTenths<0||level>126)fail('invalid saved skill data');
  return {name,level,xpTenths};
 });
 const read=(size)=>{
  if(offset+size>bytes.length-4)fail('truncated inventory/varp section');
  const start=offset;offset+=size;return start;
 };
 const varps=bytes.readUInt16BE(read(2));
 if(varps>8192)fail('unreasonably large varp count');
 for(let i=0;i<varps;i++){
  read(2);
  let part=0;
  for(;;){
   if(++part>5)fail('invalid varint');
   const b=bytes.readUInt8(read(1));
   if((b&128)===0)break;
  }
 }
 const invCount=bytes.readUInt8(read(1));
 if(invCount>64)fail('unreasonably large inventory count');
 const inventories=[];
 for(let i=0;i<invCount;i++){
  const typeId=bytes.readUInt16BE(read(2));
  const capacity=bytes.readUInt16BE(read(2));
  if(capacity>2048)fail('unexpected inventory capacity');
  const items=[];
  for(let slot=0;slot<capacity;slot++){
   const value=bytes.readUInt16BE(read(2));
   if(value===0)continue;
   const quantityFlag=bytes.readUInt8(read(1));
   const quantity=quantityFlag===255?bytes.readInt32BE(read(4)):quantityFlag;
   if(quantity<0)fail('invalid inventory item quantity');
   items.push({slot,id:value-1,count:quantity});
  }
  inventories.push({typeId,capacity,items});
 }
 return {version,position,skills,inventories,
  saveSha256:createHash('sha256').update(bytes).digest('hex')};
}
export {verifySaveSnapshot};

async function main(){
 const manifestPath=process.argv[2];
 if(process.argv.length!==3||typeof manifestPath!=='string'||!path.isAbsolute(manifestPath))
  fail('usage: node verify-harness377.mjs /tmp/joshrs-377-disposable-XXXXXX/manifest.json');
 const home=os.homedir();
 const source=path.join(home,'dev','JoshRS-source');
 const mod=await import(pathToFileURL(path.join(source,'tools/rs377-companion-contract/src/isolation.mjs')).href);
 const manifest=await mod.loadVerifiedManifest(manifestPath);
 const {worldId,ports}=manifest;
 if(manifest.account!=='HarnessTest'||manifest.host!=='127.0.0.1')
  fail('unexpected test identity');
 const buildParent=path.join(home,'dev','JoshRS-disposable-worlds');
 const buildRoot=path.join(buildParent,worldId);
 const engine=path.join(buildRoot,'engine');
 const content=path.join(buildRoot,'content');
 if(await fs.realpath(buildParent)!==buildParent||
    await fs.realpath(buildRoot)!==buildRoot||
    await fs.realpath(engine)!==engine||
    await fs.realpath(content)!==content)
  fail('disposable source directories must be real, not symlinks');
 const env=await fs.readFile(path.join(engine,'.env'),'utf8');
 const settings=new Map(env.split(/\r?\n/).filter(x=>x.includes('=')).map(x=>{
  const idx=x.indexOf('=');return [x.slice(0,idx),x.slice(idx+1)];
 }));
 if(settings.get('NODE_PROFILE')!==worldId||
    settings.get('NODE_PORT')!==String(ports.game)||
    settings.get('WEB_PORT')!==String(ports.web)||
    settings.get('WEB_MANAGEMENT_PORT')!=='8989'||
    settings.get('DB_BACKEND')!=='sqlite'||
    settings.get('NODE_PRODUCTION')!=='false')
  fail('disposable server configuration mismatch');
 if(await fs.realpath(path.join(engine,'db.sqlite'))!==path.join(manifest.paths.db,'db.sqlite')||
    await fs.realpath(path.join(engine,'data/players'))!==manifest.paths.saves)
  fail('disposable SQLite or player saves are not isolated');
 await fs.access(path.join(manifest.root,'ready-for-first-start'));
 // Refuse a different service bound to the expected disposable port. A
 // manifest or open TCP socket alone cannot establish world/process identity.
 const gamePortLines=execFileSync('ss',['-H','-ltnp','sport = :'+ports.game],{encoding:'utf8'});
 if(!gamePortLines.includes('127.0.0.1:'+ports.game))
  fail('expected isolated game listener is not bound to loopback');
 const pids=[...gamePortLines.matchAll(/pid=(\d+)/g)].map(m=>Number(m[1]));
 if(pids.length!==1||!Number.isSafeInteger(pids[0]))
  fail('could not unambiguously identify isolated game listener PID');
 const serverCwd=await fs.realpath('/proc/'+pids[0]+'/cwd');
 if(serverCwd!==engine)fail('TCP listener does not belong to the expected disposable engine directory');
 const serverEnvironment=await fs.readFile('/proc/'+pids[0]+'/environ');
 if(!serverEnvironment.includes(Buffer.from('WEBSITE_REGISTRATION=false\0')))
  fail('restart ONLY the isolated server with WEBSITE_REGISTRATION=false before HarnessTest auto-registration');
 const sessionModule=await import(pathToFileURL(path.join(source,'tools/rs377-chatgpt-bridge/src/session.mjs')).href);
 const {Session377}=sessionModule;
 const pemPath=path.join(engine,'data/config/private.pem');
 const privateResolved=await fs.realpath(pemPath);
 if(!privateResolved.startsWith(engine+path.sep))fail('RSA key points outside isolated engine');
 const publicKeyPem=createPublicKey(await fs.readFile(pemPath,'utf8')).export({format:'pem',type:'spki'});
 const response=await fetch('http://127.0.0.1:'+ports.web+'/crc0',
  {redirect:'error',signal:AbortSignal.timeout(4000)});
 if(!response.ok)fail('disposable web /crc0 did not return HTTP 200');
 const crcFull=Buffer.from(await response.arrayBuffer());
 if(crcFull.length!==40)fail('expected 40-byte genuine server cache CRC table');
 const crcs=crcFull.subarray(0,36);
 const credentialPath=path.join(manifest.paths.reports,'harnesstest-private-login.json');
 let password;
 try{
  const st=await fs.lstat(credentialPath);
  if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)!==0)fail('unsafe existing test credential file');
  const obj=JSON.parse(await fs.readFile(credentialPath,'utf8'));
  if(obj.worldId!==worldId||obj.username!=='HarnessTest'||typeof obj.password!=='string')
   fail('existing test credential identity mismatch');
  password=obj.password;
 }catch(error){
  if(error.code!=='ENOENT')throw error;
  password=randomBytes(18).toString('base64url').slice(0,20);
  await fs.writeFile(credentialPath,JSON.stringify({worldId,username:'HarnessTest',password})+'\n',
   {mode:0o600,flag:'wx'});
 }
 const makeSession=()=>new Session377({
  target:{host:'127.0.0.1',port:ports.game,mode:'isolated'},
  username:'HarnessTest',password,publicKeyPem,crcs,timeoutMs:9000
 });
 const savePath=path.join(manifest.paths.saves,worldId,'harnesstest.sav');
 const readSnap=async()=>{
  try{return verifySaveSnapshot(await fs.readFile(savePath))}
  catch(error){if(error.code==='ENOENT')return null;throw error}
 };
 const awaitSave=async(oldHash)=>{
  for(let i=0;i<125;i++){
   try{
    const snap=await readSnap();
    if(snap&&snap.saveSha256!==oldHash)return snap;
   }catch(error){
    // A writeFile can be observed half-written; retry until CRC verifies.
    if(!String(error.message).includes('CRC mismatch')&&
       !String(error.message).includes('short 377 player save'))throw error;
   }
   await wait(800);
  }
  fail('server did not produce a new valid player save after normal logout');
 };
 async function connect(){
  for(let attempt=0;attempt<6;attempt++){
   const session=makeSession();
   try{
    const result=await session.connect();
    if(!result.authenticated)fail('normal 377 TCP authentication was not successful');
    return session;
   }catch(error){
    session.close();
    if(attempt===5||!String(error.message).includes('code 3'))throw error;
    await wait(900);
   }
  }
 }
 const initial=await readSnap();
 console.log('Authenticating HarnessTest through normal isolated revision-377 TCP...');
 let session;
 try{
  session=await connect();
  console.log('VERIFIED normal TCP login: HarnessTest on '+worldId);
  await wait(1500);
 }finally{
  session?.close();
 }
 let before=initial??await awaitSave(null);
 if(initial){
  // Capture a fresh logout/save before walking, when one already existed.
  try{before=await awaitSave(initial.saveSha256)}catch{before=initial}
 }
 console.log('Genuine server save: tile ('+before.position.x+','+before.position.z+','+before.position.plane+'); '+before.skills.length+' skills; '+before.inventories.reduce((a,b)=>a+b.items.length,0)+' inventory slots populated');
 const oldHash=before.saveSha256;
 console.log('Authenticating again for a bounded four-tile walking probe...');
 session=null;
 try{
  session=await connect();
  await wait(1200);
  const {x,z}=before.position;
  const targets=[[x+1,z],[x,z+1],[x-1,z],[x,z-1]]
    .filter(([a,b])=>a>=0&&a<=16383&&b>=0&&b<=16383);
  let count=0;
  for(const [tx,tz] of targets){
   const sent=session.send({type:'walk',x:tx,z:tz,running:false});
   if(!['queued_unverified','dispatched_unverified'].includes(sent.status))
    fail('native movement packet was not accepted for transport');
   count++;
   await wait(1700);
  }
  console.log('Dispatched '+count+' normal native rev377 walking packets; effect NOT yet assumed.');
 }finally{
  session?.close();
 }
 const after=await awaitSave(oldHash);
 const moved=after.position.x!==before.position.x||after.position.z!==before.position.z;
 const result={
  status:moved?'VERIFIED_SAVED_MOVEMENT':'PARTIAL_NO_SAVED_MOVEMENT',
  worldId,revision:377,account:'HarnessTest',
  evidence:'normal_377_TCP_authentication_and_server_generated_CRC_validated_player_save',
  before:before.position,after:after.position,
  skillCount:after.skills.length,skills:after.skills,
  savedInventoryTypes:after.inventories.map(x=>({typeId:x.typeId,capacity:x.capacity,itemCount:x.items.length})),
  beforeSaveSha256:before.saveSha256,afterSaveSha256:after.saveSha256,
  liveEngineObserverConnected:false,fullSdkStateVerified:false,
  note:'Position is read from the authoritative server save after network disconnect, not a live BotWorldState observation.'
 };
 const reportPath=path.join(manifest.paths.reports,'harnesstest-authentic-walk-evidence.json');
 await fs.writeFile(reportPath,JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'w'});
 console.log('Result: '+result.status);
 console.log('Saved position: ('+before.position.x+','+before.position.z+') -> ('+after.position.x+','+after.position.z+')');
 console.log('Evidence report: '+reportPath);
 if(!moved)process.exitCode=2;
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 main().catch(error=>{
  console.error('BLOCKED: '+String(error.message).replace(/^BLOCKED: /,''));
  console.error('No live SDK observer was used. Original family world untouched by this tool.');
  process.exitCode=2;
 });
}
