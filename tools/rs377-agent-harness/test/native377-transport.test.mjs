import test from 'node:test';
import assert from 'node:assert/strict';
import {createNative377Transport} from '../src/native377/transport.mjs';
import {createFixtureTransport} from '../src/fixture-transport.mjs';
import {createHarness} from '../src/harness.mjs';

function fakeClient(){
  const calls=[];
  let connected=true;
  return {target:{world:'isolated'},calls,
    status:()=>({connected}),
    setOnline:v=>{connected=v;},
    walkTo:(x,z)=>{calls.push([x,z]);return {status:'dispatched_unverified'};}
  };
}
test('refuses to invent observations or control family-world accounts',()=>{
  const client=fakeClient();
  assert.throws(()=>createNative377Transport({client}),/Real 377 world observer/);
  client.target.world='family';
  assert.throws(()=>createNative377Transport({client,observeWorld:()=>({})}),/isolated/);
});
test('native bridge sends one normal walk packet and correctly reports unverified result',async()=>{
  const fixture=createFixtureTransport(),client=fakeClient();
  const transport=createNative377Transport({client,observeWorld:()=>fixture.observe()});
  const h=createHarness(transport,{enableIsolatedActions:true});
  const r=await h.perform({type:'walk',x:3230,z:3230});
  assert.equal(r.status,'unverified_dispatch');
  assert.deepEqual(client.calls,[[3230,3230]]);
});
test('unsupported native game packets are rejected, not fabricated as successful',async()=>{
  const fixture=createFixtureTransport(),client=fakeClient();
  const transport=createNative377Transport({client,observeWorld:()=>fixture.observe()});
  const h=createHarness(transport,{enableIsolatedActions:true});
  const r=await h.perform({type:'npc_option',npcIndex:5,option:1});
  assert.equal(r.status,'rejected');
  assert.deepEqual(client.calls,[]);
  client.setOnline(false);
  const offline=await h.perform({type:'walk',x:1,z:2});
  assert.equal(offline.status,'rejected');
  assert.deepEqual(client.calls,[]);
});
