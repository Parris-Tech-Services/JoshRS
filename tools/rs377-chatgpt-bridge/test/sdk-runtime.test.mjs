import test from 'node:test';
import assert from 'node:assert/strict';
import {createSdk377Runtime} from '../src/sdk-runtime.mjs';
const world='isolated-test-world';
const base={world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:world,sourceSha:'a'.repeat(40)},player:{username:'HarnessBot',isBot:true},tick:1,position:{x:3200,z:3200,plane:0},skills:null,inventory:null,equipment:null,nearbyNpcs:null,nearbyLocs:null,groundItems:null,dialogue:null,questStages:null,sdkDetails:null};
const options={botName:'HarnessBot',expectedWorld:world};
test('dispatches normal SDK action through authenticated native session and observed snapshot',async()=>{
 const packets=[];let reads=0;
 const session={status:()=>({authenticated:true}),sendPacket:p=>{packets.push(p);return {status:'dispatched_unverified'}}};
 const observer={observe:async()=>({...base,tick:++reads})};
 const sdk=createSdk377Runtime({session,observer,...options});
 const r=await sdk.action({type:'walkTo',x:3201,z:3201,running:false,reason:'Move'});
 assert.equal(r.opcode,28);assert.equal(r.verifiedEffect,false);assert.equal(packets.length,1);
 assert.equal(sdk.lastObservedTick(),1);
});
test('refuses unauthenticated session, missing visibility, wrong world and fake full SDK state',async()=>{
 let sent=0;
 const session={status:()=>({authenticated:false}),sendPacket:()=>{sent++;return {status:'dispatched_unverified'}}};
 const observer={observe:async()=>base};
 const sdk=createSdk377Runtime({session,observer,...options});
 await assert.rejects(()=>sdk.action({type:'walkTo',x:3201,z:3201,reason:'Move'}),/not_authenticated/);
 assert.equal(sent,0);
 session.status=()=>({authenticated:true});
 await assert.rejects(()=>sdk.action({type:'interactNpc',npcIndex:1,optionIndex:1,reason:'Talk'}),/visibility unknown/);
 await assert.rejects(()=>sdk.getSdkState(),/incomplete/);
 const other=createSdk377Runtime({session,observer:{observe:async()=>({...base,world:{...base.world,instanceId:'isolated-other'}})},...options});
 await assert.rejects(()=>other.action({type:'walkTo',x:3201,z:3201,reason:'Move'}),/world_changed/);
 assert.equal(sent,0);
});
test('executeVerifiedAction distinguishes rejected, verified_success, verified_unsuccessful, and timed_out',async()=>{
 const packets=[];
 const session={status:()=>({authenticated:true}),sendPacket:p=>{packets.push(p);return {status:'dispatched_unverified'}}};
 let tick=10,pos={x:3200,z:3200,plane:0},advanceTicks=true,moveOnNextTick=false;
 const observer={observe:async()=>{
  if(advanceTicks)tick++;
  if(moveOnNextTick && tick>11)pos={x:3201,z:3200,plane:0};
  return {...base,tick,position:{...pos}};
 }};
 const sdk=createSdk377Runtime({session,observer,...options});

 // 1) rejected (privileged action)
 const rejected=await sdk.executeVerifiedAction({type:'teleport',x:3200,z:3200,reason:'Cheat'},{timeoutMs:300,pollMs:10});
 assert.equal(rejected.status,'rejected');
 assert.equal(rejected.verifiedEffect,false);
 assert.equal(rejected.sdkResult.success,false);
 assert.equal(packets.length,0);

 // 2) verified_success (walkTo with observed coordinate change)
 moveOnNextTick=true;
 const verified=await sdk.executeVerifiedAction({type:'walkTo',x:3201,z:3200,running:false,reason:'Step east'},{timeoutMs:500,pollMs:10});
 assert.equal(verified.status,'verified_success');
 assert.equal(verified.verifiedEffect,true);
 assert.equal(verified.sdkResult.success,true);
 assert.ok(verified.observedTick>verified.tick);

 // 3) verified_unsuccessful (packet sent, ticks advance, position never changes)
 moveOnNextTick=false;
 const unsuccess=await sdk.executeVerifiedAction({type:'walkTo',x:3205,z:3205,running:false,reason:'Blocked walk'},{timeoutMs:500,pollMs:10,maxWaitTicks:3});
 assert.equal(unsuccess.status,'verified_unsuccessful');
 assert.equal(unsuccess.verifiedEffect,false);
 assert.equal(unsuccess.sdkResult.success,false);

 // 4) timed_out (tick does not advance before timeout)
 advanceTicks=false;
 const timedOut=await sdk.executeVerifiedAction({type:'walkTo',x:3202,z:3200,running:false,reason:'Stalled world'},{timeoutMs:80,pollMs:15});
 assert.equal(timedOut.status,'timed_out');
 assert.equal(timedOut.verifiedEffect,false);
 assert.equal(timedOut.sdkResult.reason,'timeout');
});
