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

test('refuses a second packet in the same server tick and dispatches on a fresh tick',async()=>{
 let tick=10;const packets=[];
 const session={status:()=>({authenticated:true}),sendPacket:p=>{packets.push(p);return {status:'dispatched_unverified'}}};
 const observer={observe:async()=>({...base,tick})};
 const sdk=createSdk377Runtime({session,observer,...options});
 await sdk.action({type:'walkTo',x:3201,z:3201,reason:'Normal movement'});
 await assert.rejects(()=>sdk.action({type:'walkTo',x:3202,z:3202,reason:'Replay'}),/replay_or_stale_tick/);
 assert.equal(packets.length,1);
 tick=11;
 await sdk.action({type:'walkTo',x:3202,z:3202,reason:'New tick'});
 assert.equal(packets.length,2);
});
test('rejects concurrent SDK actions while an observation is in flight',async()=>{
 let release;const pending=new Promise(resolve=>{release=resolve});
 const session={status:()=>({authenticated:true}),sendPacket:()=>({status:'dispatched_unverified'})};
 let reads=0;
 const observer={observe:async()=>{reads++;await pending;return {...base,tick:reads}}};
 const sdk=createSdk377Runtime({session,observer,...options});
 const first=sdk.action({type:'walkTo',x:3201,z:3201,reason:'First'});
 await assert.rejects(()=>sdk.action({type:'walkTo',x:3202,z:3202,reason:'Second'}),/concurrent_sdk_action_refused/);
 release();await first;
});

test('Issue 4: executeVerifiedAction verifies exact walkTo destination/plane and rejects partial movement, blocked paths, wrong plane, and interruption',async()=>{
 const session={status:()=>({authenticated:true}),sendPacket:()=>({status:'dispatched_unverified'})};

 // 1. Partial movement that stops before reaching (3205, 3200) -> partial_movement_blocked
 const partialSeq=[
  {...base,tick:1,position:{x:3200,z:3200,plane:0}},
  {...base,tick:2,position:{x:3201,z:3200,plane:0}},
  {...base,tick:3,position:{x:3202,z:3200,plane:0}},
  {...base,tick:4,position:{x:3202,z:3200,plane:0}},
  {...base,tick:5,position:{x:3202,z:3200,plane:0}}
 ];
 let idx=0;
 const sdkPartial=createSdk377Runtime({
  session,
  observer:{observe:async()=>partialSeq[Math.min(idx++,partialSeq.length-1)]},
  ...options
 });
 const partialRes=await sdkPartial.executeVerifiedAction(
  {type:'walkTo',x:3205,z:3200,running:false,reason:'Blocked walk'},
  {pollIntervalMs:5,timeoutMs:500}
 );
 assert.equal(partialRes.status,'verified_unsuccessful');
 assert.equal(partialRes.outcome,'partial_movement_blocked');
 assert.equal(partialRes.verified,false);

 // 2. Completely blocked path (zero movement across 3 ticks) -> unreachable_or_blocked
 const blockedSeq=[
  {...base,tick:10,position:{x:3200,z:3200,plane:0}},
  {...base,tick:11,position:{x:3200,z:3200,plane:0}},
  {...base,tick:12,position:{x:3200,z:3200,plane:0}},
  {...base,tick:13,position:{x:3200,z:3200,plane:0}}
 ];
 idx=0;
 const sdkBlocked=createSdk377Runtime({
  session,
  observer:{observe:async()=>blockedSeq[Math.min(idx++,blockedSeq.length-1)]},
  ...options
 });
 const blockedRes=await sdkBlocked.executeVerifiedAction(
  {type:'walkTo',x:3205,z:3200,running:false,reason:'Unreachable walk'},
  {pollIntervalMs:5,timeoutMs:500}
 );
 assert.equal(blockedRes.status,'verified_unsuccessful');
 assert.equal(blockedRes.outcome,'unreachable_or_blocked');
 assert.equal(blockedRes.verified,false);

 // 3. Wrong plane -> wrong_plane
 const planeSeq=[
  {...base,tick:20,position:{x:3200,z:3200,plane:0}},
  {...base,tick:21,position:{x:3201,z:3200,plane:1}}
 ];
 idx=0;
 const sdkPlane=createSdk377Runtime({
  session,
  observer:{observe:async()=>planeSeq[Math.min(idx++,planeSeq.length-1)]},
  ...options
 });
 const planeRes=await sdkPlane.executeVerifiedAction(
  {type:'walkTo',x:3201,z:3200,running:false,reason:'Wrong plane'},
  {pollIntervalMs:5,timeoutMs:500}
 );
 assert.equal(planeRes.status,'verified_unsuccessful');
 assert.equal(planeRes.outcome,'wrong_plane');
 assert.equal(planeRes.verified,false);

 // 4. Multi-step walk that reaches exact destination on expected plane -> destination_reached
 const arrivalSeq=[
  {...base,tick:30,position:{x:3200,z:3200,plane:0}},
  {...base,tick:31,position:{x:3201,z:3200,plane:0}},
  {...base,tick:32,position:{x:3202,z:3200,plane:0}},
  {...base,tick:33,position:{x:3203,z:3200,plane:0}}
 ];
 idx=0;
 const sdkArrive=createSdk377Runtime({
  session,
  observer:{observe:async()=>arrivalSeq[Math.min(idx++,arrivalSeq.length-1)]},
  ...options
 });
 const arriveRes=await sdkArrive.executeVerifiedAction(
  {type:'walkTo',x:3203,z:3200,running:false,reason:'Exact arrival'},
  {pollIntervalMs:5,timeoutMs:500}
 );
 assert.equal(arriveRes.status,'verified_success');
 assert.equal(arriveRes.outcome,'destination_reached');
 assert.equal(arriveRes.verified,true);
 assert.equal(arriveRes.startTick,30);
 assert.equal(arriveRes.endTick,33);
});

test('Issue 5: runtime enforces actionId replay protection, rate limits, and cancellation before dispatch',async()=>{
 let tick=50,sent=0;
 const session={status:()=>({authenticated:true}),sendPacket:()=>{sent++;return {status:'dispatched_unverified'}}};
 const observer={observe:async()=>({...base,tick:++tick})};
 const sdk=createSdk377Runtime({session,observer,...options,maxActionsPerMinute:3});

 await sdk.action({type:'walkTo',x:3201,z:3201,reason:'Act 1'},{actionId:'id-1'});
 await assert.rejects(
  ()=>sdk.action({type:'walkTo',x:3202,z:3202,reason:'Replay id-1'},{actionId:'id-1'}),
  /replay_or_duplicate_id/
 );
 assert.equal(sent,1);

 // Cancelled before dispatch must not send packet
 await assert.rejects(
  ()=>sdk.action({type:'walkTo',x:3202,z:3202,reason:'Cancelled'},{actionId:'id-cancel',isCancelled:()=>true}),
  /sdk_action_cancelled/
 );
 assert.equal(sent,1);

 await sdk.action({type:'walkTo',x:3202,z:3202,reason:'Act 2'},{actionId:'id-2'});
 await sdk.action({type:'walkTo',x:3203,z:3203,reason:'Act 3'},{actionId:'id-3'});
 await assert.rejects(
  ()=>sdk.action({type:'walkTo',x:3204,z:3204,reason:'Rate limit'},{actionId:'id-4'}),
  /rate_limit_exceeded/
 );
 assert.equal(sent,3);
});
