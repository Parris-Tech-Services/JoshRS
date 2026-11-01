import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,rm,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareDisposable,loadVerifiedManifest,verifyIsolationManifest,runIsolatedIntegration,PRODUCTION_PORTS} from '../src/isolation.mjs';

test('prepare creates a new loopback-only disposable world with separate saves/DB and no account registration',async()=>{
 const {manifest,filename}=await prepareDisposable();
 try{
  assert.equal(manifest.host,'127.0.0.1');
  assert.equal(manifest.account,'HarnessTest');
  assert.equal(manifest.tickMs,600);
  assert.equal(manifest.xpMultiplier,1);
  for(const port of Object.values(manifest.ports))assert.ok(!PRODUCTION_PORTS.includes(port));
  assert.ok(manifest.paths.saves!==manifest.paths.db);
  assert.ok(filename.includes('joshrs-377-disposable-'));
  assert.deepEqual(await loadVerifiedManifest(filename),manifest);
 }finally{await rm(manifest.root,{recursive:true,force:true});}
});
test('manifest rejects family world, real game ports, reused service ports, wrong identity and path traversal',async()=>{
 const {manifest}=await prepareDisposable();
 try{
  const change=fn=>{const copy=structuredClone(manifest);fn(copy);return copy;};
  for(const x of [
   change(m=>{m.mode='family';}),change(m=>{m.host='0.0.0.0';}),
   change(m=>{m.ports.game=52402;}),change(m=>{m.ports.friends=m.ports.game;}),
   change(m=>{m.paths.saves='/home/josh/dev/JoshRS/lostcity377/data/players';}),
   change(m=>{m.account='Elrothiro';}),change(m=>{m.tickMs=200;}),
   change(m=>{m.xpMultiplier=8;}),change(m=>{m.password='hidden';})
  ])assert.throws(()=>verifyIsolationManifest(x));
  assert.throws(()=>verifyIsolationManifest(manifest,{rootHint:'/tmp/not-this-world'}),/mismatch/);
 }finally{await rm(manifest.root,{recursive:true,force:true});}
});
test('real adapter is required and actual world mismatch is blocked without any gameplay actions',async()=>{
 const {manifest}=await prepareDisposable();
 try{
  await assert.rejects(()=>runIsolatedIntegration({manifest}),/Actual isolated/);
  let actions=0;
  const adapter={getWorldIdentity:async()=>({worldId:'isolated-wrong',revision:377,mode:'isolated',
      host:'127.0.0.1',tickMs:600,xpMultiplier:1,gamePort:manifest.ports.game,account:manifest.account}),
    observeBot:async()=>({tick:1,player:{username:'HarnessTest'}}),
    dispatch:async()=>{actions++;return {accepted:true};}};
  await assert.rejects(()=>runIsolatedIntegration({manifest,adapter}),/differs/);
  assert.equal(actions,0);
  adapter.getWorldIdentity=async()=>({worldId:manifest.worldId,revision:377,mode:'isolated',
      host:'127.0.0.1',tickMs:600,xpMultiplier:1,gamePort:manifest.ports.game,account:manifest.account});
  const r=await runIsolatedIntegration({manifest,adapter});
  assert.equal(r.status,'connected_read_only');
  assert.equal(actions,0);
 }finally{await rm(manifest.root,{recursive:true,force:true});}
});
test('CLI --prepare/--verify works without any engine, saves or credentials; --run fails without real adapter',async()=>{
 const cli=fileURLToPath(new URL('../src/run-integration.mjs',import.meta.url));
 const a=spawnSync(process.execPath,[cli,'--prepare'],{encoding:'utf8',timeout:8000});
 assert.equal(a.status,0,a.stderr);
 const m=JSON.parse(a.stdout);assert.equal(m.status,'prepared_no_game_started');
 try{
  const v=spawnSync(process.execPath,[cli,'--verify',m.manifest],{encoding:'utf8',timeout:8000});
  assert.equal(v.status,0,v.stderr);
  assert.equal(JSON.parse(v.stdout).status,'isolated_manifest_verified_no_game_started');
  const x=spawnSync(process.execPath,[cli,'--run',m.manifest],{encoding:'utf8',timeout:8000});
  assert.equal(x.status,2);
  assert.match(x.stderr,/real native 377 adapter/);
 }finally{await rm((await loadVerifiedManifest(m.manifest)).root,{recursive:true,force:true});}
});
