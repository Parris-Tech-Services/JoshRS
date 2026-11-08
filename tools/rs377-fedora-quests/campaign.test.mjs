import test from 'node:test';
import assert from 'node:assert/strict';
import {readCatalogue,questPlan,planSummary,nameKey} from './catalog.mjs';
import {dryCampaign,executeCampaign,STATUS,observedQuestStage,verifiedAction} from './campaign.mjs';

const catalogue=readCatalogue();
test('full rev377 catalogue includes exactly 104 quests and seven miniquests',()=>{
 assert.equal(catalogue.questCount,104);
 assert.equal(catalogue.miniquestCount,7);
 assert.equal(catalogue.entries.length,111);
 assert.equal(new Set(catalogue.entries.map(q=>q.id)).size,111);
 assert.equal(catalogue.entries.find(q=>q.id==='legends')?.name,"Legends Quest");
 assert.equal(catalogue.entries.find(q=>q.id==='swansong')?.releaseDate,'2006-05-02');
 assert.equal(catalogue.entries.find(q=>q.id==='barcrawl')?.kind,'miniquest');
});
test('all quest prerequisites precede their child; release priority newest-first',()=>{
 for(const newestFirst of [true,false]){
  const plan=questPlan(catalogue,{newestFirst});
  const byIndex=new Map(plan.map((q,i)=>[q.id,i]));
  assert.equal(plan.length,111);
  for(const quest of plan){
   for(const required of quest.prerequisites){
    assert.ok(byIndex.get(required)<byIndex.get(quest.id),quest.name+' requires '+required);
   }
  }
 }
 const summary=planSummary(questPlan(catalogue));
 assert.equal(summary.total,111);
 assert.equal(summary.quests,104);
 assert.equal(summary.miniquests,7);
 assert.equal(summary.livePlayableVerified,0);
});
test('filtered quest pulls its prerequisite closure, rejects unknown target',()=>{
 const plan=questPlan(catalogue,{filter:'scorpcatcher'});
 assert.ok(plan.some(q=>q.id==='barcrawl'));
 assert.equal(plan.at(-1).id,'scorpcatcher');
 assert.throws(()=>questPlan(catalogue,{filter:'mysterious_unknown_quest'}),/unknown/);
});
test('metadata plan never claims a playthrough or actions',()=>{
 const result=dryCampaign(catalogue,questPlan(catalogue));
 assert.equal(result.records.length,111);
 assert.equal(result.actualFullQuestPlaythroughsVerified,0);
 assert.ok(result.records.every(q=>q.gameplayActions===0&&q.status===STATUS.UNTESTED));
 assert.ok(!JSON.stringify(result).includes('VERIFIED_PLAYABLE'));
});
test('quest state has no default: omitted, invalid and null are unobserved',()=>{
 assert.equal(observedQuestStage({},'cook').available,false);
 assert.equal(observedQuestStage({joshrsQuestStages:{cook:null}},'cook').available,false);
 assert.equal(observedQuestStage({joshrsQuestStages:{cook:0}},'cook').available,true);
 assert.equal(observedQuestStage({joshrsQuestStages:{cook:{varp:2}}},'cook').available,true);
 assert.equal(verifiedAction({success:true,phase:'completion'}),false);
 assert.equal(verifiedAction({success:true,phase:'completion',data:{verifiedEffect:true}}),true);
});
function fakeSdk(stage={cook:0}){
 let tick=0;
 return {getState(){return {tick:++tick,inGame:true,
   player:{name:'HarnessTest'},joshrsQuestStages:stage}}};
}
const planCook=()=>questPlan(catalogue,{filter:'cook'});
test('a genuine action effect may only produce PARTIAL, never full quest completion',async()=>{
 let checkpoints=0;
 const ledger=await executeCampaign({catalogue,plan:planCook(),sdk:fakeSdk(),bot:{},
   username:'HarnessTest',worldId:'isolated-fake-unit-test',
   playbooks:{cook:async({recordAction})=>{
      recordAction({success:true,phase:'completion',data:{verifiedEffect:true}});
      return {observed:true};
   }},onCheckpoint:async()=>{checkpoints++}});
 assert.equal(ledger.records.length,1);
 assert.equal(checkpoints,1);
 assert.equal(ledger.records[0].status,STATUS.PARTIAL);
 assert.equal(ledger.records[0].gameplayActions,1);
 assert.equal(ledger.records[0].realClientPlaythroughVerified,false);
 assert.equal(ledger.actualFullQuestPlaythroughsVerified,0);
});
test('no playbook and no native quest varp fail closed without actions',async()=>{
 const absent=await executeCampaign({catalogue,plan:planCook(),sdk:fakeSdk(),bot:{},
   username:'HarnessTest',worldId:'isolated-fake-unit-test'});
 assert.equal(absent.records[0].status,STATUS.NO_PLAYBOOK);
 const noVarp=await executeCampaign({catalogue,plan:planCook(),sdk:fakeSdk({}),bot:{},
   username:'HarnessTest',worldId:'isolated-fake-unit-test',playbooks:{cook:async()=>({observed:true})}});
 assert.equal(noVarp.records[0].status,STATUS.TELEMETRY);
});
test('packet sent or action claimed without native postcondition cannot pass',async()=>{
 const ledger=await executeCampaign({catalogue,plan:planCook(),sdk:fakeSdk(),bot:{},
  username:'HarnessTest',worldId:'isolated-fake-unit-test',
  playbooks:{cook:async({recordAction})=>{
   recordAction({success:true,phase:'completion',data:{verifiedEffect:false}});
   return {observed:true};
  }}});
 assert.equal(ledger.records[0].status,STATUS.FAILED);
 assert.equal(ledger.actualFullQuestPlaythroughsVerified,0);
});
test('unrecognised account and forbidden host classification blocked',async()=>{
 await assert.rejects(()=>executeCampaign({catalogue,plan:planCook(),sdk:{
  getState(){return {inGame:true,tick:5,player:{name:'SomebodyElse'}}}},bot:{},
  username:'HarnessTest',worldId:'isolated-fake-unit-test'}),/state_not_present/);
 assert.equal(dryCampaign(catalogue,[]).actualFullQuestPlaythroughsVerified,0);
});
