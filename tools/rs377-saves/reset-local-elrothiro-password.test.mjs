import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { crc32 } from './inspect-save.mjs';
import { recover } from './reset-local-elrothiro-password.mjs';

const oldHash='$2b$10$'+'0'.repeat(53);
const newHash='$2b$10$'+'1'.repeat(53);

function fixture({saveValid=true, includeAccount=true}={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-recover-'));
  const engine=path.join(root,'runtime','jparris-377','usb-fixture','engine');
  fs.mkdirSync(path.join(engine,'data','players','main'),{recursive:true});
  fs.mkdirSync(path.join(engine,'src'),{recursive:true});
  fs.writeFileSync(path.join(engine,'package.json'),'{"name":"fixture-engine"}');
  fs.writeFileSync(path.join(engine,'src','app.ts'),'// synthetic test only');
  fs.writeFileSync(path.join(root,'runtime','jparris-377','active.json'),'\uFEFF'+JSON.stringify({engine}));
  const savePath=path.join(engine,'data','players','main','elrothiro.sav');
  const save=Buffer.alloc(160,0);
  save.writeUInt16BE(0x2004,0);save.writeUInt16BE(7,2);save.writeInt32BE(57309,24);
  save.writeUInt32BE(crc32(save.subarray(0,save.length-4)),save.length-4);
  if(!saveValid)save[40]=255;
  fs.writeFileSync(savePath,save);
  const dbPath=path.join(engine,'db.sqlite');
  const db=new DatabaseSync(dbPath);
  db.exec('CREATE TABLE account (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL)');
  if(includeAccount)db.prepare('INSERT INTO account (id,username,password) VALUES (?,?,?)').run(7,'elrothiro',oldHash);
  db.prepare('INSERT INTO account (id,username,password) VALUES (?,?,?)').run(8,'sylvie',oldHash);
  db.close();
  return {root,engine,dbPath,savePath,cleanup:()=>fs.rmSync(root,{force:true,recursive:true,maxRetries:10,retryDelay:200})};
}
const hashPassword=(password,work)=>{assert.equal(password,'a');assert.equal(work,10);return newHash};
const comparePassword=(password,hash)=>password==='a'&&hash===newHash;
const safe={confirmValue:'CHANGE ELROTHIRO TO A',hashPassword,comparePassword,offlineCheck:()=>{}};

test('offline reset preserves account id, other players, sav bytes and full verified backup',async()=>{
  const x=fixture();
  try{
    const sourceSav=fs.readFileSync(x.savePath),sourceDb=fs.readFileSync(x.dbPath);
    let gateCalls=0;
    const r=await recover({...safe,root:x.root,offlineCheck:()=>{gateCalls++;}});
    assert.equal(r.status,'PASSWORD_RESET_TO_A');
    assert.equal(gateCalls,2);
    assert.ok(r.accountIdUnchanged&&r.accountCountUnchanged&&r.saveSha256Unchanged);
    assert.ok(fs.readFileSync(x.savePath).equals(sourceSav));
    const db=new DatabaseSync(x.dbPath,{readOnly:true});
    let accounts;
    try { accounts=db.prepare('SELECT id,username,password FROM account ORDER BY id').all().map(row=>({...row})); }
    finally { db.close(); }
    assert.deepEqual(accounts,[
      {id:7,username:'elrothiro',password:newHash},{id:8,username:'sylvie',password:oldHash}
    ]);
    assert.ok(fs.readFileSync(path.join(r.backupPath,'db.sqlite')).equals(sourceDb));
    assert.ok(fs.readFileSync(path.join(r.backupPath,'players','main','elrothiro.sav')).equals(sourceSav));
    const manifest=JSON.parse(fs.readFileSync(path.join(r.backupPath,'integrity.json'),'utf8'));
    assert.equal(manifest.version,1);
    assert.equal(manifest.files.length,2);
    assert.ok(manifest.files.some(f=>f.relative==='db.sqlite'));
    assert.ok(manifest.files.some(f=>f.relative==='players/main/elrothiro.sav'));
  }finally{x.cleanup()}
});
test('never changes DB without explicit confirmation',async()=>{
 const x=fixture();try{
 const before=fs.readFileSync(x.dbPath);
 await assert.rejects(recover({...safe,root:x.root,confirmValue:''}),/confirmation/);
 assert.ok(before.equals(fs.readFileSync(x.dbPath)));
 }finally{x.cleanup()}
});
test('refuses reset if server still present, even if ports may be closed',async()=>{
 const x=fixture();try{
 const before=fs.readFileSync(x.dbPath);
 await assert.rejects(recover({...safe,root:x.root,offlineCheck:()=>{throw Error('STILL RUNNING')}}),/STILL RUNNING/);
 assert.ok(before.equals(fs.readFileSync(x.dbPath)));
 }finally{x.cleanup()}
});
test('refuses invalid save and missing account without changing database',async()=>{
 for(const opts of [{saveValid:false},{includeAccount:false}]){
  const x=fixture(opts);try{
   const before=fs.readFileSync(x.dbPath);
   await assert.rejects(recover({...safe,root:x.root}));
   assert.ok(before.equals(fs.readFileSync(x.dbPath)));
  }finally{x.cleanup()}
 }
});
test('rechecks server process after backup and blocks if it appears',async()=>{
 const x=fixture();try{
 const before=fs.readFileSync(x.dbPath);
 let count=0;
 await assert.rejects(recover({...safe,root:x.root,offlineCheck:()=>{if(++count===2)throw Error('SERVER RETURNED')}}),/SERVER RETURNED/);
 assert.equal(count,2);
 assert.ok(before.equals(fs.readFileSync(x.dbPath)));
 }finally{x.cleanup()}
});
