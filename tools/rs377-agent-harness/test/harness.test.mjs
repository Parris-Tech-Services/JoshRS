import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTION_TYPES,validateAction,validateSnapshot } from '../src/guard.mjs';
import { createHarness } from '../src/harness.mjs';
import { createFixtureTransport } from '../src/fixture-transport.mjs';

test('bounded normal gameplay operations only; no direct grants or arbitrary code',()=>{
  assert.deepEqual(ACTION_TYPES,['walk','npc_option','loc_option','ground_take','inventory_option','item_on_loc','dialog_option','wait']);
  for(const type of ['invAdd','addXp','setVar','teleport','spawn','exec','eval','giveItem','attack_with_admin']) {
    assert.throws(()=>validateAction({type}),/Unsupported or privileged/);
  }
  assert.throws(()=>validateAction({type:'walk',x:3,z:4,admin:true}),/Unexpected/);
  assert.throws(()=>validateAction({type:'walk',x:3.4,z:4}),/Invalid/);
  assert.throws(()=>validateAction({type:'wait',ticks:50}),/Invalid/);
});
test('default operation is a dry run; it cannot dispatch',async()=>{
  const t=createFixtureTransport(),h=createHarness(t);
  const before=await h.observe();
  assert.equal((await h.perform({type:'walk',x:3230,z:3230})).status,'dry_run');
  assert.deepEqual(await h.observe(),before);
});
test('isolated normal-speed fixture may move, but movement is not full quest completion',async()=>{
  const t=createFixtureTransport(),h=createHarness(t,{enableIsolatedActions:true});
  const result=await h.perform({type:'walk',x:3224,z:3218});
  assert.equal(result.status,'observed_effect');
  assert.deepEqual(result.evidence,['position']);
  assert.equal((await h.observe()).player.x,3224);
  assert.equal((await h.observe()).player.questStages.cooks_assistant,0);
});
test('dispatch without observed effect is NOT successful gameplay',async()=>{
  const h=createHarness(createFixtureTransport(),{enableIsolatedActions:true});
  const r=await h.perform({type:'wait',ticks:1});
  assert.equal(r.status,'unverified_dispatch');
  assert.deepEqual(r.evidence,[]);
});
test('invalid or family-world snapshots fail closed before any action',async()=>{
  const t=createFixtureTransport(),h=createHarness(t,{enableIsolatedActions:true});
  t.setWorldMode('family_world');
  await assert.rejects(()=>h.perform({type:'walk',x:1,z:1}),/isolated/);
});
test('different user account cannot be controlled',async()=>{
  const t=createFixtureTransport(),h=createHarness(t,{enableIsolatedActions:true});
  t.setPlayerName('Elrothiro');
  await assert.rejects(()=>h.perform({type:'walk',x:1,z:1}),/Unapproved/);
});
test('rejects world tick regression',async()=>{
  const t=createFixtureTransport(),h=createHarness(t,{enableIsolatedActions:true});
  const old=t.observe;
  let times=0;
  t.observe=async()=>{const s=await old();if(++times===2)s.tick=0;return s};
  await assert.rejects(()=>h.perform({type:'walk',x:1,z:1}),/backwards/);
});
test('rejects invalid or spoofed world and account metadata',async()=>{
  const t=createFixtureTransport();let s=await t.observe();
  s.world.xpMultiplier=25;
  assert.throws(()=>validateSnapshot(s,['HarnessTest']),/normal-speed/);
  s.world.xpMultiplier=1;s.player.isBot=false;
  assert.throws(()=>validateSnapshot(s,['HarnessTest']),/Unapproved/);
});
