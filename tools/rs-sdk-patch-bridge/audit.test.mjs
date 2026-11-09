import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {audit,parseArgs} from './audit.mjs';
const put=(base,rel,data)=>{const p=path.join(base,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,data);return p;};
function fixture(t) {
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-sdk-audit-'));t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
  const source=path.join(home,'source'),sdk=path.join(home,'rs-sdk');
  put(source,'content-patches/rs377/patches/0001-match.patch','--- a/scripts/foo/a.rs2\n+++ b/scripts/foo/a.rs2\n@@ -1 +1 @@\n-old\n+new\n');
  put(source,'content-patches/rs377/patches/0002-unsupported.patch','--- a/scripts/foo/missing.rs2\n+++ b/scripts/foo/missing.rs2\n@@ -1 +1 @@\n-never\n+always\n');
  put(source,'content-patches/rs377/patches/0003-engine.patch','--- a/server/engine/src/foo.ts\n+++ b/server/engine/src/foo.ts\n@@ -1 +1 @@\n-x\n+y\n');
  put(source,'content-patches/rs377/scripts/quests/quest_foo/scripts/a.rs2','story');
  put(source,'tools/rs-sdk-quests/patches/0004-helper.patch','--- a/sdk/runner.ts\n+++ b/sdk/runner.ts\n@@ -1 +1 @@\n-old\n+new\n');
  put(sdk,'sdk/API.md','# sdk\n');put(sdk,'server/engine/package.json','{}');
  put(sdk,'server/engine/data/config/world.json',JSON.stringify({engine:{revision:289}}));
  put(sdk,'server/content/scripts/foo/a.rs2','old\n');
  return {source,sdk};
}
test('reports matching, mismatching and out-of-scope patches without writing',t=>{
  const {source,sdk}=fixture(t);
  const before=fs.readFileSync(path.join(sdk,'server/content/scripts/foo/a.rs2'));
  const x=audit({source,sdk});
  assert.equal(x.readOnly,true);
  assert.equal(x.automaticallySafeToApply,0);
  assert.equal(x.sdkRevision,289);
  assert.equal(x.patches.length,4);
  assert.equal(x.patches[0].status,'hunks-appear-applicable');
  assert.equal(x.patches[1].status,'requires-manual-port');
  assert.equal(x.patches[2].status,'requires-manual-port');
  assert.equal(x.patches[3].status,'requires-manual-port');
  assert.equal(x.scriptBundle[0].status,'missing');
  assert.deepEqual(fs.readFileSync(path.join(sdk,'server/content/scripts/foo/a.rs2')),before);
});
test('already-applied hunks do not trigger any rewrite',t=>{
  const {source,sdk}=fixture(t);
  put(sdk,'server/content/scripts/foo/a.rs2','new\n');
  const x=audit({source,sdk});
  assert.equal(x.patches[0].status,'already-applied-hunks');
});
test('refuses symlinks into unrelated worlds and malformed args',t=>{
  const {source,sdk}=fixture(t);
  assert.throws(()=>parseArgs(['--sdk','relative']),/absolute/);
  const target=path.join(sdk,'server/content/scripts/foo/a.rs2');
  fs.unlinkSync(target);fs.symlinkSync('/etc/passwd',target);
  assert.throws(()=>audit({source,sdk}),/Symlink/);
});
test('rejects symlinked patch root, not just target',t=>{
  const {source,sdk}=fixture(t);
  const p=path.join(source,'content-patches/rs377/patches/0001-match.patch');
  fs.unlinkSync(p);fs.symlinkSync('/etc/passwd',p);
  assert.throws(()=>audit({source,sdk}),/Symlink/);
});
