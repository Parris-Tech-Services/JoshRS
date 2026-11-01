import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const doctor=new URL('./rs377-bot-doctor.mjs',import.meta.url);
const config=new URL('./rs377-bot-config.example.json',import.meta.url);
test('doctor emits redacted structured blockers without claiming world ready',()=>{
 const result=JSON.parse(execFileSync(process.execPath,[doctor.pathname,'--json'],{encoding:'utf8'}));
 assert.equal(result.worldReady,false);
 assert.ok(result.blockers.length>=3);
 assert.ok(result.sourceCommit);
 assert.ok(result.checks.every(c=>['pass','blocked'].includes(c.status)));
 assert.ok(!JSON.stringify(result).includes('passwordEnv'));
});
test('example config fails closed and never includes credentials',()=>{
 const c=JSON.parse(readFileSync(config));
 assert.equal(c.mode,'offline');assert.equal(c.productionEnabled,false);
 assert.equal(c.gateway.enabled,false);assert.equal(c.gateway.control,false);
 assert.equal(c.safety.allowAdminMutations,false);assert.equal(c.safety.allowSaveWrites,false);
 assert.match(c.account.username,/REPLACE/);assert.ok(!('password' in c.account));
});
