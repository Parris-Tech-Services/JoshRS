import test from 'node:test';
import assert from 'node:assert/strict';
import {checkGameplayAcceptance} from '../src/gameplay-acceptance.mjs';
const sha='b5ac859b47915afb545e60e4c1208f25d43cb3fb',worldId='isolated-acceptance';
const snap=(tick,logs,bank,xp,questStage=0)=>({
 tick,source:'engine-377-authoritative',
 world:{revision:377,instanceId:worldId,sourceSha:sha,tickMs:600,xpMultiplier:1},
 player:{username:'HarnessTest'},inventory:[{id:1511,count:logs}],bank:[{id:1511,count:bank}],
 skills:{Woodcutting:{xpTenths:xp}},questStage,
 inventoryHash:'i',bankHash:'b',skillsHash:'s'
});
const event=(type,source,tick=2)=>({type,source,tick,bot:'HarnessTest',worldId,observed:true});
const events=[
 event('npc_dialogue_open','java-client-377'),
 event('npc_dialogue_choice','java-client-377'),
 event('loc_interaction','engine-377-authoritative'),
 event('item_gathered','engine-377-authoritative'),
 event('bank_deposit','engine-377-authoritative'),
 event('bank_withdraw','engine-377-authoritative'),
 event('logout','native-client-377',4),event('relogin','native-client-377',5),
 {...event('save_verified','db-377-persistence',6),inventoryHash:'i',bankHash:'b',skillsHash:'s'}
];
const opts={botName:'HarnessTest',worldId,sourceSha:sha,logItemId:1511,bankItemId:1511};
const snapshots=[snap(1,0,0,0),snap(3,2,0,150),snap(4,1,1,150),snap(7,1,1,150)];
test('fixture cannot be certified as real gameplay even if every claimed condition is present',()=>{
 const r=checkGameplayAcceptance({...opts,snapshots,events});
 assert.equal(r.status,'blocked');assert.ok(r.failures.includes('fixture_not_live_runtime_proof'));
});
test('claimed runtime trace only passes capture assertions and still requires independent review',()=>{
 const r=checkGameplayAcceptance({...opts,snapshots,events,evidenceOrigin:'real-runtime-capture'});
 assert.equal(r.status,'capture_assertions_passed_pending_independent_review');
});
test('rejects fake quest stage progression without both independent hand-in sources',()=>{
 const s=snapshots.map(x=>({...x}));s[3].questStage=2;
 const r=checkGameplayAcceptance({...opts,snapshots:s,events,evidenceOrigin:'real-runtime-capture'});
 assert.ok(r.failures.includes('synthetic_or_unverified_quest_progress'));
});
test('rejects XP rate cheat, inventory-only gathering, bank-only claims and save mismatch',()=>{
 const wrong=snapshots.map(x=>({...x,world:{...x.world,xpMultiplier:2}}));
 assert.ok(checkGameplayAcceptance({...opts,snapshots:wrong,events,evidenceOrigin:'real-runtime-capture'}).failures.includes('invalid_or_incomplete_authoritative_snapshot'));
 const noXp=snapshots.map(x=>({...x,skills:{Woodcutting:{xpTenths:0}}}));
 assert.ok(checkGameplayAcceptance({...opts,snapshots:noXp,events,evidenceOrigin:'real-runtime-capture'}).failures.includes('gathering_requires_real_xp_and_inventory_increase'));
 const noBank=snapshots.map(x=>({...x,bank:[{id:1511,count:0}]}));
 assert.ok(checkGameplayAcceptance({...opts,snapshots:noBank,events,evidenceOrigin:'real-runtime-capture'}).failures.includes('bank_item_delta_not_observed'));
 const mismatch=events.map(x=>x.type==='save_verified'?{...x,skillsHash:'wrong'}:x);
 assert.ok(checkGameplayAcceptance({...opts,snapshots,events:mismatch,evidenceOrigin:'real-runtime-capture'}).failures.includes('post_relogin_persistence_mismatch'));
});
test('rejects explicit grants and server-only NPC dialogue',()=>{
 const cheat=[...events,event('addXp','engine-377-authoritative')];
 assert.ok(checkGameplayAcceptance({...opts,snapshots,events:cheat,evidenceOrigin:'real-runtime-capture'}).failures.includes('cheat_or_synthetic_event'));
 const noClient=events.filter(x=>x.type!=='npc_dialogue_choice');
 assert.ok(checkGameplayAcceptance({...opts,snapshots,events:noClient,evidenceOrigin:'real-runtime-capture'}).failures.includes('genuine_npc_dialogue_not_seen_in_client'));
});
