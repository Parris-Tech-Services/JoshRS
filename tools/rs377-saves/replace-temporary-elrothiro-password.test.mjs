import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { verifyBackup } from './replace-temporary-elrothiro-password.mjs';

function fixture() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-password-'));
  const engine=path.join(dir,'engine'), backup=path.join(dir,'backup');
  fs.mkdirSync(path.join(engine,'data','players','main'),{recursive:true});
  fs.mkdirSync(path.join(backup,'players','main'),{recursive:true});
  const entries=[['db.sqlite',Buffer.from('FAKE DB')],['players/main/elrothiro.sav',Buffer.from('FAKE SAVE')]];
  const files=[];
  for(const [rel,data] of entries) {
    const target=rel.startsWith('players/') ? path.join(engine,'data',...rel.split('/')) : path.join(engine,rel);
    const snapshot=path.join(backup,...rel.split('/'));
    fs.writeFileSync(target,data);fs.writeFileSync(snapshot,data);
    files.push({relativePath:rel,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex').toUpperCase()});
  }
  fs.writeFileSync(path.join(backup,'integrity.json'),JSON.stringify({version:1,files}));
  return {dir,engine,backup,files,close:()=>fs.rmSync(dir,{recursive:true,force:true})};
}

test('matching manually verified backup covers original character and database',()=>{
  const f=fixture();
  try {assert.equal(verifyBackup(f.engine,f.backup),true);}finally{f.close();}
});
test('refuses to use stale cold backup after active database changes',()=>{
  const f=fixture();
  try {
    fs.writeFileSync(path.join(f.engine,'db.sqlite'),'CHANGED');
    assert.throws(()=>verifyBackup(f.engine,f.backup),/Live data differs/);
  }finally{f.close();}
});
test('refuses mismatched backup checksum',()=>{
  const f=fixture();
  try {
    fs.writeFileSync(path.join(f.backup,'db.sqlite'),'TAMPERED');
    assert.throws(()=>verifyBackup(f.engine,f.backup),/Backup checksum failure/);
  }finally{f.close();}
});
test('refuses backup with traversal filenames',()=>{
  const f=fixture();
  try {
    f.files[1].relativePath='players/../../private.txt';
    fs.writeFileSync(path.join(f.backup,'integrity.json'),JSON.stringify({version:1,files:f.files}));
    assert.throws(()=>verifyBackup(f.engine,f.backup),/Unsafe backup entry/);
  }finally{f.close();}
});
test('refuses wrong character snapshot',()=>{
  const f=fixture();
  try {assert.throws(()=>verifyBackup(f.engine,f.backup,'sylvie'),/missing target character/);}finally{f.close();}
});
