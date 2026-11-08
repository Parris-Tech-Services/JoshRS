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
