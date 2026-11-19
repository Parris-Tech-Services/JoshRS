import test from 'node:test';
import assert from 'node:assert/strict';
import {AgentFleet,validateProfile} from '../fleet.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('strict disposable identity, no family credentials and supported goals only',()=>{
 assert.throws(()=>validateProfile({name:'Elrothiro',goal:'explore'}),/disposable/);
 assert.throws(()=>validateProfile({name:'Sylvie',goal:'idle'}),/disposable/);
 assert.throws(()=>validateProfile({name:'HarnessA',goal:'quest'}),/unsupported_goal/);
 assert.equal(validateProfile({name:'HarnessA',goal:'explore'}).name,'HarnessA');
});
test('two independent accounts connect, move normally, pause and close with no fabricated save status',async()=>{
 const events=[],connected=[],closed=[];
 const adapterFactory=async({name,password})=>{
  assert.equal(password,'private-ci-password');
  let pos={x:3200,z:3200,plane:0},tick=0,live=false;
  return {
   async connect(){connected.push(name);live=true},
   async observe(){if(!live)throw Error('native_offline');return {position:{...pos},tick:++tick}},
   async move(p){if(!live)throw Error('offline');pos={...pos,...p};events.push(name);return {status:'dispatched_unverified'}},
   async close(){if(live)closed.push(name);live=false}
  };
 };
 const fleet=new AgentFleet({adapterFactory});
 fleet.add({name:'HarnessA',goal:'explore'});fleet.add({name:'HarnessB',goal:'explore'});
 assert.throws(()=>fleet.add({name:'HarnessA',goal:'explore'}),/already_exists/);
 await Promise.all(['HarnessA','HarnessB'].map(name=>fleet.start(name,'private-ci-password')));
 assert.equal(fleet.list().length,2);
 for(let i=0;i<45&&fleet.list().some(e=>e.verifiedSteps<1);i++)await sleep(120);
 assert.deepEqual(fleet.list().map(x=>x.verifiedSteps>0),[true,true]);
 fleet.pause('HarnessA');const first=fleet.get('HarnessA').verifiedSteps;
 await sleep(1250);
 assert.equal(fleet.get('HarnessA').verifiedSteps,first,'paused account must not count new movement');
 fleet.resume('HarnessA');
 const status=await Promise.all(['HarnessA','HarnessB'].map(name=>fleet.stop(name)));
 assert.ok(status.every(s=>s.status==='closed_unverified_save'&&!s.saveVerified));
 assert.deepEqual(connected.sort(),['HarnessA','HarnessB']);
 assert.deepEqual(closed.sort(),['HarnessA','HarnessB']);
 assert.ok(events.includes('HarnessA')&&events.includes('HarnessB'));
 assert.ok(fleet.list().every(x=>x.phase==='stopped'&&x.nativeSaveVerified===false&&x.fullSdkStateVerified===false));
 assert.equal(JSON.stringify(fleet.list()).includes('private-ci-password'),false);
});
test('rejects duplicate starts and disallowed unknown/privileged goals',async()=>{
 const fleet=new AgentFleet({adapterFactory:async()=>({
  async connect(){},async observe(){return {position:{x:0,z:0},tick:1}},
  async close(){}
 })});
 fleet.add({name:'HarnessC',goal:'idle'});
 await assert.rejects(()=>fleet.start('HarnessC','weak'),/password/);
 await assert.rejects(()=>fleet.start('HarnessC','this-password-is-more-than-twenty-chars'),/password/);
 await assert.rejects(()=>fleet.start('HarnessC','invalid-unicode-🚀'),/password/);
 await fleet.start('HarnessC','valid-secret-1234');
 await assert.rejects(()=>fleet.start('HarnessC','valid-secret-1234'),/already_started/);
 assert.throws(()=>fleet.setGoal('HarnessC','bank'),/unsupported_goal/);
 await fleet.stop('HarnessC');
});
