import test from 'node:test';
import assert from 'node:assert/strict';
import {AgentFleet} from '../fleet.mjs';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(predicate,{maxMs=2800}={}){
 const deadline=Date.now()+maxMs;
 while(Date.now()<deadline){
  if(predicate())return;
  await wait(45);
 }
 throw new Error('verified_native_activity_not_observed');
}
const password='private-ci-pass-123';
const base=(name)=>({
 player:{username:name,isBot:true},
 position:{x:3200,z:3200,plane:0},
 tick:12,
 skills:[{name:'Woodcutting',level:1,baseLevel:1,xpTenths:0}],
 inventory:[{slot:0,id:1351,name:'Bronze axe',count:1}],
 equipment:[],
 nearbyLocs:[{id:1278,name:'Tree',x:3201,z:3201,
   optionsWithIndex:[{text:'Chop down',opIndex:1}]}],
 nearbyNpcs:[{index:14,id:1,name:'Guide',x:3201,z:3200,
   optionsWithIndex:[{text:'Talk-to',opIndex:1}]}],
 dialogue:{isOpen:false,isWaiting:false}
});
test('woodcut goal dispatches a normal observed tree action and counts ONLY rising real XP',async()=>{
 let clicked=0,connected=false;
 const f=new AgentFleet({adapterFactory:async({name})=>{
  let s=base(name);
  return {
   async connect(){connected=true},
   async observe(){return structuredClone(s)},
   async interactLoc(loc){
    assert.deepEqual(loc,{x:3201,z:3201,locId:1278,optionIndex:1});
    clicked++;
    s.skills[0].xpTenths=500;s.tick++;
    return {status:'dispatched_unverified'}
   },
   async close(){connected=false}
  };
 }});
 f.add({name:'HarnessA',goal:'woodcut'});
 await f.start('HarnessA',password);
 await until(()=>f.get('HarnessA').verifiedActivities>=1);
 assert.ok(clicked>=1);
 assert.equal(f.list()[0].lastVerified.activity,'Woodcutting');
 assert.ok(f.list()[0].lastVerified.xpGainTenths>0);
 await f.stop('HarnessA');
 assert.equal(connected,false);
 assert.equal(f.list()[0].nativeSaveVerified,false);
});
test('woodcut goal rejects missing REAL axe and never counts packet dispatch as XP',async()=>{
 let clicked=0;
 const f=new AgentFleet({adapterFactory:async({name})=>{
  const s=base(name);s.inventory=[];
  return {async connect(){},async observe(){return s},
   async interactLoc(){clicked++;return {status:'dispatched_unverified'}},
   async close(){}};
 }});
 f.add({name:'HarnessB',goal:'woodcut'});
 await f.start('HarnessB',password);
 await until(()=>f.list()[0].phase==='error');
 assert.equal(clicked,0);
 assert.equal(f.list()[0].verifiedActivities,0);
 assert.match(f.list()[0].error,/real_axe_required/);
 await f.stop('HarnessB');
});
test('NPC goal accepts only an actual observed dialog change and pauses awaiting user choice',async()=>{
 let did=false;
 const f=new AgentFleet({adapterFactory:async({name})=>{
  const s=base(name);
  return {async connect(){},async observe(){return structuredClone(s)},
   async interactNpc({npcIndex,optionIndex}){
    assert.equal(npcIndex,14);assert.equal(optionIndex,1);
    did=true;s.dialogue={isOpen:true,isWaiting:true};s.tick++;
    return {status:'dispatched_unverified'};
   },async close(){}};
 }});
 f.add({name:'HarnessC',goal:'talk'});
 await f.start('HarnessC',password);
 await until(()=>f.get('HarnessC').phase==='paused');
 assert.equal(did,true);
 assert.equal(f.list()[0].verifiedActivities,1);
 assert.equal(f.list()[0].lastVerified.activity,'NPC dialogue');
 await f.stop('HarnessC');
});
