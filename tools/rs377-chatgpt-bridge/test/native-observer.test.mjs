import test from 'node:test';
import assert from 'node:assert/strict';
import {createNative377Observer} from '../src/native-observer.mjs';
const token='test-token-only-not-a-real-secret-123456789';
const base={world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:'isolated-test-world',sourceSha:'a'.repeat(40)},player:{username:'HarnessBot',isBot:true},tick:1,position:null,skills:null,inventory:null,equipment:null,nearbyNpcs:null,nearbyLocs:null,groundItems:null,dialogue:null,questStages:null,sdkDetails:null};
const opts={botName:'HarnessBot',expectedWorld:'isolated-test-world',token};
test('reads authenticated native snapshot through actual callback and freezes result',async()=>{
 const source={read:async()=>({token,sequence:1,observation:base})};
 const observer=createNative377Observer(source,opts);
 const state=await observer.observe();assert.equal(state.tick,1);assert.ok(Object.isFrozen(state.world));
 assert.ok(state.unsupported.includes('skills'));
});
test('rejects forged token and replayed sequence',async()=>{
 let n=0;const source={read:async()=>({token,sequence:1,observation:{...base,tick:++n}})};
 const o=createNative377Observer(source,opts);await o.observe();
 await assert.rejects(()=>o.observe(),/replayed/);
 const forged=createNative377Observer({read:async()=>({token:'wrong',sequence:2,observation:base})},opts);
 await assert.rejects(()=>forged.observe(),/unauthenticated/);
});
test('rejects wrong world, identity and unexpected private data',async()=>{
 for(const observation of [{...base,world:{...base.world,instanceId:'isolated-other'}},{...base,player:{username:'Elrothiro',isBot:false}},{...base,password:'never expose'}]){
  const o=createNative377Observer({read:async()=>({token,sequence:1,observation})},opts);
  await assert.rejects(()=>o.observe());
 }
});
