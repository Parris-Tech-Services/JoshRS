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
