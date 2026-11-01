import test from 'node:test';
import assert from 'node:assert/strict';
import {createNoCheatGathering,inspectCooksAssistantEvidence} from '../src/scenarios.mjs';
function snap(tick=1,inv=[],xp=0){
 return {world:{revision:377,mode:'isolated',tickMs:600,xpMultiplier:1,instanceId:'isolated-gather01'},tick,
 player:{username:'HarnessTest',isBot:true,plane:0,inventory:inv,xp:{Woodcutting:xp}},
 nearbyGroundItems:[],nearbyLocs:[]};
}
const options={botName:'HarnessTest',axeItemId:1351,logItemId:1511,treeObjectId:1276,
 axeSource:{type:'ground_take',itemId:1351,x:3220,z:3218}};
test('fresh bot without verified axe source fails closed; no free starter inventory',()=>{
 const p=createNoCheatGathering(options);
 assert.equal(p.next(snap()).reason,'item_not_observed_on_ground');
 assert.throws(()=>createNoCheatGathering({botName:'HarnessTest',axeItemId:1351,logItemId:1511}),/source-backed/);
});
test('real observed ground item yields a normal ground-pickup action, never invAdd',()=>{
 const p=createNoCheatGathering(options),s=snap();
 s.nearbyGroundItems=[{itemId:1351,x:3220,z:3218,plane:0}];
 const r=p.next(s);
 assert.equal(r.stage,'acquire_axe');
 assert.deepEqual(r.action,{type:'ground_take',x:3220,z:3218,itemId:1351});
 assert.equal(JSON.stringify(r).includes('invAdd'),false);
});
test('requires axe then verified ordinary tree, logs and actual XP before bank gate',()=>{
 const p=createNoCheatGathering(options);
 const old=snap(3);old.nearbyGroundItems=[{itemId:1351,x:3220,z:3218,plane:0}];p.next(old);
 const axe={slot:0,id:1351,quantity:1};
 const tree=snap(4,[axe]);tree.nearbyLocs=[{id:1276,x:3221,z:3218,plane:0,options:['Chop down']}];
 const chop=p.next(tree);assert.equal(chop.stage,'chop_tree');assert.equal(chop.action.type,'loc_option');
 const missingXp=snap(5,[axe,{slot:1,id:1511,quantity:1}],0);
 assert.equal(p.next(missingXp).reason,'logs_seen_but_no_real_xp_gain');
 const gained=snap(6,[axe,{slot:1,id:1511,quantity:1}],250);
 const bank=p.next(gained);
 assert.equal(bank.stage,'bank_logs');
 assert.equal(bank.status,'blocked'); // Native #377 bank deposit not implemented.
 assert.equal(bank.observed.woodcuttingXpIncrease,250);
});
test('wrong world identity, fabricated account and accelerated XP are rejected',()=>{
 const p=createNoCheatGathering(options);p.next(snap());
 const alt=snap(2);alt.world.instanceId='isolated-someother';
 assert.throws(()=>p.next(alt),/identity changed/);
 const fast=snap(2);fast.world.xpMultiplier=8;
 assert.throws(()=>p.next(fast),/Untrusted/);
 const human=snap(2);human.player.username='Elrothiro';
 assert.throws(()=>p.next(human),/wrong-player/);
});
test('Cook quest cannot be declared complete from flags and XP without real provenance',()=>{
 const before={questStage:1,cookingXp:0},after={questStage:2,cookingXp:3000};
 let r=inspectCooksAssistantEvidence({before,after,events:[]});
 assert.equal(r.status,'blocked');assert.equal(r.missing.length,3);
 const events=['bucket_milk','egg','pot_flour'].map((item,tick)=>({type:'native_item_acquired',observed:true,item,tick}));
 r=inspectCooksAssistantEvidence({before,after,events});
 assert.equal(r.status,'blocked');
 events.push({type:'npc_quest_hand_in',observed:true,tick:20},{type:'save_relog_verified',observed:true,tick:21});
 r=inspectCooksAssistantEvidence({before,after,events});
 assert.equal(r.status,'evidence_ready_for_independent_runtime_review');
 events.push({type:'invAdd',item:'bucket_milk',tick:22});
 assert.equal(inspectCooksAssistantEvidence({before,after,events}).status,'blocked');
});
