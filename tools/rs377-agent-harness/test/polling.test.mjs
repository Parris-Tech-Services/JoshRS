import test from 'node:test';
import assert from 'node:assert/strict';
import {createHarness} from '../src/harness.mjs';
import {createFixtureTransport} from '../src/fixture-transport.mjs';

test('tick-aware polling sees a genuine change after a delayed server tick',async()=>{
  const fixture=createFixtureTransport();
  let observations=0;
  const h=createHarness({
    observe:async()=>{
      observations++;
      if(observations===3)await fixture.dispatch({type:'walk',x:3230,z:3230});
      return fixture.observe();
    },
    dispatch:async()=>({accepted:true})
  },{enableIsolatedActions:true,maxWaitMs:500,pollIntervalMs:50});
  const r=await h.perform({type:'walk',x:3230,z:3230});
  assert.equal(r.status,'observed_effect');
  assert.deepEqual(r.evidence,['position']);
  assert.ok(observations>=3);
});
test('expired observation window reports unverified, not fake success',async()=>{
  const fixture=createFixtureTransport();
  const h=createHarness({
    observe:()=>fixture.observe(),
    dispatch:async()=>({accepted:true})
  },{enableIsolatedActions:true,maxWaitMs:80,pollIntervalMs:50});
  const r=await h.perform({type:'walk',x:3230,z:3230});
  assert.equal(r.status,'unverified_dispatch');
  assert.deepEqual(r.evidence,[]);
});
test('invalid polling configuration cannot create unbounded loops',()=>{
  const fixture=createFixtureTransport();
  assert.throws(()=>createHarness(fixture,{maxWaitMs:Infinity}),/Invalid bounded/);
  assert.throws(()=>createHarness(fixture,{maxWaitMs:50000}),/Invalid bounded/);
  assert.throws(()=>createHarness(fixture,{pollIntervalMs:0}),/Invalid polling/);
});
