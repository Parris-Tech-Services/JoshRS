import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionPolicy} from '../src/session-policy.mjs';
const identity={worldId:'isolated-myworld01',botName:'HarnessTest'};
test('one bot has only one valid connecting or online lease',()=>{
 const s=createSessionPolicy({worldId:identity.worldId});
 assert.equal(s.begin({tick:0,identity}).status,'permitted');
 assert.equal(s.begin({tick:1,identity}).reason,'duplicate_session');
 assert.equal(s.authenticated({tick:2,identity}).status,'online');
 assert.equal(s.begin({tick:3,identity}).reason,'duplicate_session');
 assert.equal(s.canDispatch({tick:4,identity}).allowed,true);
});
test('disconnected bot cannot act until bounded backoff, no infinite loops',()=>{
 const s=createSessionPolicy({worldId:identity.worldId,initialBackoffTicks:4,maxAttempts:2});
 s.begin({tick:0,identity});
 assert.equal(s.disconnected({tick:1,identity}).nextRetryTick,5);
 assert.equal(s.canDispatch({tick:2,identity}).allowed,false);
 assert.equal(s.begin({tick:3,identity}).reason,'retry_backoff');
 assert.equal(s.begin({tick:5,identity}).status,'permitted');
 assert.equal(s.disconnected({tick:6,identity}).nextRetryTick,14);
 assert.equal(s.begin({tick:14,identity}).reason,'retry_budget_exhausted');
 assert.equal(s.stop().reconnectPermitted,false);
 assert.equal(s.begin({tick:20,identity}).reason,'operator_stopped');
});
test('world and player identities must match; no tick rollback or session takeover',()=>{
 const s=createSessionPolicy({worldId:identity.worldId});
 assert.throws(()=>s.begin({tick:1,identity:{...identity,botName:'Elrothiro'}}),/mismatch/);
 assert.throws(()=>s.begin({tick:1,identity:{...identity,worldId:'isolated-otherworld'}}),/mismatch/);
 assert.equal(s.begin({tick:1,identity}).status,'permitted');
 assert.throws(()=>s.canDispatch({tick:0,identity}),/regressed/);
});
