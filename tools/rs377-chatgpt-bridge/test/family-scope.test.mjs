import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateObservation} from '../src/observation.mjs';
import {mapSdkAction} from '../src/sdk-bridge.mjs';
import {createSdk377Runtime} from '../src/sdk-runtime.mjs';

const ROOT=new URL('../../../',import.meta.url);
const family=()=>({
 world:{mode:'family',revision:377,tickMs:600,xpMultiplier:1,
  instanceId:'family-joshrs-377',sourceSha:'a'.repeat(40)},
 player:{username:'HarnessView1',isBot:true},
 tick:12,position:{x:3233,z:3217,plane:0},
 skills:null,inventory:null,equipment:null,nearbyNpcs:null,nearbyLocs:null,
 groundItems:null,dialogue:null,questStages:null,sdkDetails:null
});
const scope={botName:'HarnessView1',expectedWorld:'family-joshrs-377'};
test('production #377 bot observations deny family by default and permit only explicit approved bot',()=>{
 assert.throws(()=>validateObservation(family(),scope),/explicit approval/);
 const x=validateObservation(family(),{...scope,approvedFamily:true});
 assert.equal(x.world.instanceId,'family-joshrs-377');
 for(const mutate of [
  x=>x.player.username='Elrothiro',
  x=>x.player.username='Sylvie',
  x=>x.world.instanceId='family-other-377',
  x=>x.world.xpMultiplier=20,
  x=>x.world.tickMs=400,
  x=>x.world.mode='foreign'
 ]){
  const fake=family();mutate(fake);
  assert.throws(()=>validateObservation(fake,{...scope,approvedFamily:true}),/identity|approval|normal speed/);
 }
});
test('native packet actions need the additional family flag, real normal bot state and account',async()=>{
 const x=validateObservation(family(),{...scope,approvedFamily:true});
 assert.throws(()=>mapSdkAction({type:'walkTo',x:3234,z:3218,reason:'normal',running:false},x),
  /approved family/);
 const action={type:'walkTo',x:3234,z:3218,reason:'normal',running:false};
 assert.equal(mapSdkAction(action,x,{approvedFamily:true}).packet.opcode,28);
 let sent=0;
 const session={status:()=>({mode:'family',authenticated:true}),sendPacket:p=>{
  sent++;return {status:'dispatched_unverified'};
 }};
 const runtime=createSdk377Runtime({session,observer:{observe:async()=>family()},
  ...scope,approvedFamily:true});
 const result=await runtime.action(action);
 assert.equal(result.verifiedEffect,false);
 assert.equal(sent,1);
 await assert.rejects(()=>runtime.action(action),/replay_or_stale_tick/);
 assert.equal(sent,1);
 const deny=createSdk377Runtime({session,observer:{observe:async()=>family()},...scope});
 await assert.rejects(()=>deny.action(action),/approved family/);
 assert.equal(sent,1);
 assert.throws(()=>createSdk377Runtime({session:{...session,status:()=>({mode:'isolated',authenticated:true})},
  observer:{observe:async()=>family()},...scope,approvedFamily:true}),/not_authorized/);
});
test('source-level family observer is restricted to local known ports and exact HarnessView1 identity',()=>{
 const web=readFileSync(new URL('../../rs377-bot-bench/engine-patch/src/web.ts',import.meta.url),'utf8');
 const trace=readFileSync(new URL('../../rs377-bot-bench/engine-patch/src/engine/observer/Native377Trace.ts',import.meta.url),'utf8');
 for(const text of [web,trace]){
  assert.match(text,/RS377_OBSERVER_FAMILY_APPROVED/);
  assert.match(text,/HarnessView1@2026-11-09/);
  assert.match(text,/RS377_OBSERVER_ISOLATED/);
  assert.match(text,/RS377_OBSERVER_BOT/);
  assert.match(text,/52402/);
 }
 assert.match(web,/WEB_MANAGEMENT_PORT === '8898'/);
 assert.match(web,/timingSafeEqual/);
 assert.match(web,/127\.0\.0\.1/);
 const script=readFileSync(new URL('../../rs377-live-quest-bridge/run-fedora.mjs',import.meta.url),'utf8');
 assert.match(script,/approvedFamily:true/);
 assert.match(script,/--check/);
 assert.match(script,/BOT='HarnessView1'/);
 assert.doesNotMatch(script,/setVarp|invAdd|grantXp|modifySave/);
});
