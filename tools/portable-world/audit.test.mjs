import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script=join(dirname(fileURLToPath(import.meta.url)),'audit.mjs');
async function write(filename,contents) {
  await mkdir(dirname(filename),{recursive:true});
  await writeFile(filename,contents);
}
test('read-only inventory excludes private records, detects actual changes, never overwrites',async()=>{
  const tmp=await mkdtemp(join(tmpdir(),'joshrs-audit-test-'));
  try {
    const root=join(tmp,'launcher'),live=join(tmp,'live'),base=join(tmp,'base'),out=join(tmp,'report');
    await write(join(root,'runtime','jparris-377','active.json'),JSON.stringify({
      engine:join(live,'engine'),content:join(live,'content'),client:join(live,'client')
    }));
    await write(join(live,'engine','src','app.ts'),'custom-code');
    await write(join(live,'engine','src','fresh.rs2'),'new-quest');
    await write(join(live,'engine','src','passwords.json'),'private-secret');
    await write(join(live,'engine','data','players','main','elrothiro.sav'),'saved-secret');
    await write(join(live,'engine','db.sqlite'),'database-secret');
    await write(join(live,'engine','.env'),'TOKEN=secret');
    await write(join(live,'content','scripts','quest.rs2'),'dialogue');
    await write(join(live,'client','src','Main.java'),'modified-client');
    await write(join(live,'client','src','picture.png'),'requires-rights-review');
    await write(join(base,'engine','src','app.ts'),'original-code');
    await write(join(base,'content','scripts','quest.rs2'),'dialogue');
    await write(join(base,'client','src','Main.java'),'modified-client');
    const argv=[script,'--root',root,'--output',out,
      '--baseline-engine',join(base,'engine'),'--baseline-content',join(base,'content'),'--baseline-client',join(base,'client')];
    const run=spawnSync(process.execPath,argv,{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const report=JSON.parse(await readFile(join(out,'inventory.json'),'utf8'));
    assert.equal(report.worlds.engine.comparison.counts.modified,1);
    assert.equal(report.worlds.engine.comparison.counts.added,1);
    assert.equal(report.worlds.content.comparison.counts.modified,0);
    assert.equal(report.worlds.client.files.find(x=>x.path==='src/picture.png').category,'asset-review-only');
    assert.equal(report.privateWorld.playerDirectoryPresent,true);
    assert.equal(report.privateWorld.accountDatabasePresent,true);
    const raw=await readFile(join(out,'inventory.json'),'utf8');
    for(const forbidden of ['private-secret','saved-secret','database-secret','TOKEN=secret',
      'passwords.json','elrothiro.sav',tmp]) assert.equal(raw.includes(forbidden),false,'leaked: '+forbidden);
    const repeat=spawnSync(process.execPath,argv,{encoding:'utf8'});
    assert.notEqual(repeat.status,0,'must not overwrite an audit report');
    assert.deepEqual((await readdir(out)).sort(),['SUMMARY.txt','inventory.json']);
  } finally {await rm(tmp,{recursive:true,force:true});}
});
test('fails safely when installed runtime is missing',async()=>{
  const tmp=await mkdtemp(join(tmpdir(),'joshrs-no-runtime-'));
  try {
    const run=spawnSync(process.execPath,[script,'--root',tmp,'--output',join(tmp,'report')],{encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.match(run.stderr,/No active.json found/);
  } finally {await rm(tmp,{recursive:true,force:true});}
});

test('accepts PowerShell 5.1 UTF-8 BOM active.json without modifying it',async()=>{
  const tmp=await mkdtemp(join(tmpdir(),'joshrs-active-bom-'));
  try {
    const root=join(tmp,'launcher'),live=join(tmp,'live'),out=join(tmp,'out');
    const activeFile=join(root,'runtime','jparris-377','active.json');
    const original='\uFEFF'+JSON.stringify({
      engine:join(live,'engine'),content:join(live,'content'),client:join(live,'client')
    });
    await write(activeFile,original);
    await write(join(live,'engine','src','engine.ts'),'// test content');
    await write(join(live,'content','scripts','quest.rs2'),'// test content');
    await write(join(live,'client','src','Main.java'),'// test client');
    const run=spawnSync(process.execPath,[script,'--root',root,'--output',out],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const result=JSON.parse(await readFile(join(out,'inventory.json'),'utf8'));
    for(const type of ['engine','content','client']) {
      assert.equal(result.worlds[type].present,true);
      assert.equal(result.worlds[type].fileCount,1);
    }
    assert.equal(await readFile(activeFile,'utf8'),original,'must not rewrite BOM configuration');
  } finally {await rm(tmp,{recursive:true,force:true});}
});

test('accepts repeated UTF-8 BOM markers and leading whitespace safely',async()=>{
  const tmp=await mkdtemp(join(tmpdir(),'joshrs-repeat-bom-'));
  try {
    const root=join(tmp,'launcher'),live=join(tmp,'world'),out=join(tmp,'output');
    const activeFile=join(root,'runtime','jparris-377','active.json');
    const original='\uFEFF \uFEFF\r\n\uFEFF'+JSON.stringify({
      engine:join(live,'engine'),content:join(live,'content'),client:join(live,'client')
    });
    await write(activeFile,original);
    await write(join(live,'engine','src','app.ts'),'code');
    await write(join(live,'content','scripts','quest.rs2'),'content');
    await write(join(live,'client','src','Main.java'),'client');
    const run=spawnSync(process.execPath,[script,'--root',root,'--output',out],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    assert.match(run.stdout,/BOM-safe revision 3/);
    const report=JSON.parse(await readFile(join(out,'inventory.json'),'utf8'));
    for(const type of ['engine','content','client']) assert.equal(report.worlds[type].fileCount,1);
    assert.equal(await readFile(activeFile,'utf8'),original);
  } finally {await rm(tmp,{recursive:true,force:true});}
});
test('invalid active.json fails without echoing private JSON content',async()=>{
  const tmp=await mkdtemp(join(tmpdir(),'joshrs-private-invalid-'));
  try {
    const root=join(tmp,'launcher'),out=join(tmp,'out'),filename=join(root,'runtime','jparris-377','active.json');
    await write(filename,'\uFEFF{"privatePath":"SECRET-PATH-DO-NOT-PRINT",broken');
    const run=spawnSync(process.execPath,[script,'--root',root,'--output',out],{encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.match(run.stderr,/Cannot parse active.json/);
    assert.equal(run.stderr.includes('SECRET-PATH-DO-NOT-PRINT'),false);
  } finally {await rm(tmp,{recursive:true,force:true});}
});

test('inventories .pack/.varp/.constant and detects modified ID maps',async()=>{
  const tmp=await mkdtemp(join(tmpdir(),'joshrs-idmap-audit-'));
  try {
    const root=join(tmp,'launcher'),live=join(tmp,'live'),base=join(tmp,'baseline'),out=join(tmp,'report');
    await write(join(root,'runtime','jparris-377','active.json'),JSON.stringify({
      engine:join(live,'engine'),content:join(live,'content'),client:join(live,'client')
    }));
    await write(join(live,'content','pack','category.pack'),'category-changed');
    await write(join(live,'content','pack','script.pack'),'script-changed');
    await write(join(live,'content','scripts','_unpack','377','all.varp'),'varp-changed');
    await write(join(live,'content','scripts','general','configs','quest.constant'),'constants');
    await write(join(base,'content','pack','category.pack'),'category-original');
    await write(join(base,'content','pack','script.pack'),'script-original');
    await write(join(base,'content','scripts','_unpack','377','all.varp'),'varp-original');
    await write(join(base,'content','scripts','general','configs','quest.constant'),'constants');
    for(const type of ['engine','client']) {
      await write(join(live,type,'src','app.ts'),'same');
      await write(join(base,type,'src','app.ts'),'same');
    }
    const run=spawnSync(process.execPath,[script,'--root',root,'--output',out,
      '--baseline-engine',join(base,'engine'),'--baseline-content',join(base,'content'),
      '--baseline-client',join(base,'client')],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const report=JSON.parse(await readFile(join(out,'inventory.json'),'utf8'));
    const content=report.worlds.content;
    assert.equal(content.comparison.counts.modified,3);
    assert.equal(content.files.some(x=>x.path==='pack/category.pack'),true);
    assert.equal(content.files.some(x=>x.path==='pack/script.pack'),true);
    assert.equal(content.files.some(x=>x.path==='scripts/_unpack/377/all.varp'),true);
    assert.equal(content.files.some(x=>x.path==='scripts/general/configs/quest.constant'),true);
  } finally {await rm(tmp,{recursive:true,force:true});}
});
