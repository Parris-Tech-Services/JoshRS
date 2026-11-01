import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,statSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('../cli/capture-evidence.mjs',import.meta.url));
const template=fileURLToPath(new URL('../fixtures/evidence-capture.template.json',import.meta.url));
const run=(...args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
test('CLI parses capture and refuses to overwrite an existing output',()=>{
 const dir=mkdtempSync(join(tmpdir(),'rs377-capture-'));
 try{
  const output=join(dir,'safe.json');
  let r=run('--input',template,'--output',output);
  assert.equal(r.status,0,r.stderr);
  assert.equal(JSON.parse(readFileSync(output,'utf8')).liveVerified,false);
  if(process.platform!=='win32')assert.equal(statSync(output).mode&0o777,0o600);
  r=run('--input',template,'--output',output);
  assert.equal(r.status,2);
  assert.match(r.stderr,/BLOCKED/);
  assert.equal(r.stderr.includes(dir),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('CLI returns a safe error for invalid inputs',()=>{
 const dir=mkdtempSync(join(tmpdir(),'rs377-capture-'));
 try{
  const path=join(dir,'bad.json');
  writeFileSync(path,JSON.stringify({password:'do_not_echo'}));
  const r=run('--input',path);
  assert.equal(r.status,2);
  assert.doesNotMatch(r.stderr,/do_not_echo|password|bad.json/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
