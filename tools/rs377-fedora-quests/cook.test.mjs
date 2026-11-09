import test from 'node:test';
import assert from 'node:assert/strict';
import {stage,item,cookingXp,run} from './playbooks/cook.ts';

const baseline=()=>({inGame:true,tick:1,player:{name:'HarnessQuest',worldX:3209,worldZ:3214,level:0},
 joshrsQuestStages:{cook:1},skills:[{name:'Cooking',experience:120}],
 inventory:[{name:'Pot'},{name:'Bucket'}],groundItems:[],nearbyNpcs:[],nearbyLocs:[]});
test('read-only stage and inventory extraction never invent quest progress',()=>{
 assert.equal(stage({}),null);assert.equal(stage({joshrsQuestStages:{cook:2}}),2);
 assert.equal(stage({joshrsQuestStages:{cook:{cookquest:1}}}),1);
 assert.equal(stage({joshrsQuestStages:{cook:{varp:2}}}),2);
 assert.equal(stage({joshrsQuestStages:{cook:{bad:7}}}),null);
 assert.equal(item({inventory:[{name:'Bucket of milk'}]},/^bucket$/i),null);
 assert.equal(cookingXp({skills:[{name:'Cooking',experience:30.5}]}),30.5);
 assert.equal(cookingXp({skills:[]}),null);
});
test('already completed source stage never counted as a fresh playthrough',async()=>{
 const s=baseline();s.joshrsQuestStages.cook=2;
 const r=await run({sdk:{getState:()=>s},bot:{},quest:{id:'cook'},recordAction:()=>{throw Error('action not allowed')}});
 assert.deepEqual(r,{blocked:true,reason:'already_complete_before_run_not_new_playthrough',observed:false});
});
test('missing real pot blocks, without fabricated item grant or other account changes',async()=>{
 const s=baseline();s.inventory=[];
 const sdk={getState:()=>s,waitForCondition:async()=>{throw Error('not observed')}};
 const r=await run({sdk,bot:{walkTo:async()=>{throw Error('should not move')}},quest:{id:'cook'},
   recordAction:()=>{throw Error('should not record')}});
 assert.equal(r.reason,'ordinary_pot_missing_use_native_ground_or_bank');
 assert.equal(s.inventory.length,0);
});
test('explicit isolated Harness identity and correct quest are required',async()=>{
 const s=baseline();s.player.name='Elrothiro';
 await assert.rejects(()=>run({sdk:{getState:()=>s},bot:{},quest:{id:'cook'},
   recordAction:()=>{}}),/separate_quest_bot_required/);
 await assert.rejects(()=>run({sdk:{getState:()=>s},bot:{},quest:{id:'sheep'},
   recordAction:()=>{}}),/wrong_quest_playbook/);
});
test('synthetic Cook sequence exercises ordinary SDK interactions; NOT real-game proof',async()=>{
 const s=baseline();
 const actions=[],history=[], verified={success:true,phase:'completion',data:{verifiedEffect:true}};
 const near=(x,z)=>Math.max(Math.abs(s.player.worldX-x),Math.abs(s.player.worldZ-z))<=6;
 const sdk={
  getState(){
   s.tick++;
   s.nearbyNpcs=near(3209,3214)?[{name:'Cook',index:8}]:
     near(3253,3270)?[{name:'Dairy cow',index:4}]:[];
   s.groundItems=near(3231,3295)&&!s.inventory.some(i=>i.name==='Egg')?
     [{name:'Egg',id:1944,x:3231,z:3295}]:[];
   s.nearbyLocs=near(3165,3298)&&s.player.level===0?
     [{name:'Wheat',options:['Pick'],x:3165,z:3298,id:20},
      {name:'Ladder',options:['Climb-up'],id:21}]:
     near(3165,3306)&&s.player.level===2?[
      {name:'Hopper',options:['Use'],id:22},
      {name:'Hopper controls',options:['Operate'],id:23},
      {name:'Ladder',options:['Climb-down'],id:24}
     ]:near(3165,3306)&&s.player.level===1?[
      {name:'Ladder',options:['Climb-up','Climb-down'],id:21}
     ]:near(3165,3306)?[
      {name:'Ladder',options:['Climb-up'],id:21},
      {name:'Flour bin',options:['Empty'],id:25}
     ]:[];
   return s;
  },
  async waitForCondition(predicate){if(predicate(this.getState()))return this.getState();throw Error('missing game effect')},
  async sendTalkToNpc(){
   actions.push('talk-to-cook');
   assert.ok(near(3209,3214));
   s.joshrsQuestStages.cook=2;s.skills[0].experience+=300;
   s.inventory=s.inventory.filter(i=>!['Egg','Bucket of milk','Pot of flour'].includes(i.name));
   return verified;
  }
 };
 const bot={
  async walkTo(x,z,tolerance){actions.push('walk');s.player.worldX=x;s.player.worldZ=z;return {success:true}},
  async pickupItem(found){history.push(found.name);s.inventory.push({name:found.name});return {success:true}},
  async useItemOnNpc(bucket,cow){
   actions.push('milk');
   assert.match(cow.name,/cow/i);
   s.inventory=s.inventory.filter(i=>i.name!=='Bucket');
   s.inventory.push({name:'Bucket of milk'});return {success:true};
  },
  async useItemOnLoc(){actions.push('hopper');s.inventory=s.inventory.filter(i=>i.name!=='Grain');return {success:true}},
  async interactLoc(loc,option){
   if(loc instanceof RegExp && /^ladder$/i.test('Ladder') && loc.test('Ladder')) loc={name:'Ladder'};
   if(/^wheat$/i.test(loc.name)){actions.push('wheat');s.inventory.push({name:'Grain'})}
   else if(/^ladder$/i.test(loc.name)){
    const dir=String(option).includes('up')?1:-1;
    s.player.level+=dir;
    if(s.player.level===0){s.player.worldX=3165;s.player.worldZ=3306;}
   }else if(/hopper controls/i.test(loc.name)){actions.push('operate')}
   else if(/flour bin/i.test(loc.name)){actions.push('flour');s.inventory.push({name:'Pot of flour'})}
   else throw Error('unexpected location '+loc.name);
   return {success:true};
  }
 };
 const result=await run({sdk,bot,quest:{id:'cook'},recordAction:r=>assert.equal(r.data?.verifiedEffect,true)});
 assert.equal(result.observed,true);
 assert.equal(result.completionStageObserved,true);
 assert.equal(result.cookingXpGained,300);
 assert.ok(result.needs.includes('native_logout_relogin'));
 assert.deepEqual(history,['Egg']);
 assert.ok(actions.includes('milk')&&actions.includes('wheat')&&actions.includes('flour'));
 assert.equal(stage(s),2);
});
