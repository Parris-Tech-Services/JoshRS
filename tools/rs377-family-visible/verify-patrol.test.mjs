import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parseArgs,patrolProcessSignature,classify,inspectNativeSave,readSnapshot,
  compareSnapshots,watch} from './verify-patrol.mjs';

const makeSave=(x,z,level=0)=>{
 const b=Buffer.alloc(80);
 b.writeUInt16BE(0x2004,0);
 b.writeUInt16BE(x,4);
 b.writeUInt16BE(z,6);
 b.writeUInt8(level,8);
 return b;
};
const snap=(x,z,time)=>({mtimeMs:time,position:inspectNativeSave(makeSave(x,z))});

test('explicit controller pid and mode only',()=>{
 assert.deepEqual(parseArgs(['--pid','794093','--watch']),{pid:794093,mode:'--watch'});
 assert.throws(()=>parseArgs([]),/pid/);
 assert.throws(()=>parseArgs(['--pid','0']),/positive/);
 assert.throws(()=>parseArgs(['--pid','a']),/positive/);
 assert.throws(()=>parseArgs(['--pid','123','--hack']),/Usage/);
});
test('must be exact existing harnessview1 network patrol, not another user/engine',()=>{
 const good=['/usr/bin/node','tools/rs377-family-visible/join.mjs','--connect',
   '--allow-family','--host','127.0.0.1','--bot','HarnessView1','--patrol','--seconds','600'];
 assert.equal(patrolProcessSignature(good),true);
 assert.equal(patrolProcessSignature(good.map(x=>x==='HarnessView1'?'Elrothiro':x)),false);
 assert.equal(patrolProcessSignature(good.filter(x=>x!=='--patrol')),false);
 assert.equal(patrolProcessSignature(['node','badprogram',...good.slice(2)]),false);
});
test('native packed coordinates and region guards reject unsupported saves',()=>{
 assert.deepEqual(inspectNativeSave(makeSave(3233,3218)),
  {x:3233,z:3218,level:0,region:'LUMBRIDGE'});
 assert.equal(classify(3094,3106,0),'TUTORIAL_ISLAND');
 assert.equal(classify(3233,3218,1),'OTHER');
 assert.throws(()=>inspectNativeSave(Buffer.alloc(2)),/Unrecognised/);
});
test('read only snapshot does not alter the real or fixture save',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'joshrs-patrol-proof-'));
 try{
  const file=path.join(dir,'harnessview1.sav');
  const original=makeSave(3233,3218);
  writeFileSync(file,original);
  const snapshot=readSnapshot(file);
  assert.equal(snapshot.position.x,3233);
  assert.deepEqual(readFileSync(file),original);
  symlinkSync(file,path.join(dir,'symlink.sav'));
  assert.throws(()=>readSnapshot(path.join(dir,'symlink.sav')),/regular native/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('must see post-baseline changed persisted coordinates, not packet dispatch',()=>{
 assert.equal(compareSnapshots(snap(3233,3218,100),snap(3231,3218,200)).status,
  'PERSISTED_POSITION_CHANGED');
 assert.equal(compareSnapshots(snap(3233,3218,100),snap(3233,3218,200)).status,'UNVERIFIED');
 assert.equal(compareSnapshots(snap(3233,3218,100),snap(3231,3218,100)).status,'UNVERIFIED');
 assert.equal(compareSnapshots(snap(3094,3106,100),snap(3233,3218,200)).status,'UNVERIFIED');
});
test('watch does not stop PID and produces evidence only after session ends',async()=>{
 let calls=0,reads=0;
 const outcome=await watch({pid:794093,active:()=>++calls<=2,
   read:()=>++reads===1?snap(3233,3218,100):snap(3231,3218,200),
   now:()=>0,wait:async()=>{},limitMs:1000,log:()=>{}});
 assert.equal(outcome.status,'PERSISTED_POSITION_CHANGED');
 assert.equal(reads,2);
});
