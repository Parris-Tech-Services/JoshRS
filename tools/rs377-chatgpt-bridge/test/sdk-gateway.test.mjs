import test from 'node:test';
import assert from 'node:assert/strict';
import {createSdk377Gateway} from '../src/sdk-gateway.mjs';
const token='test-gateway-token-at-least-32-bytes-long';
test('gateway requires loopback and long token',()=>{
 const runtime={getSdkState:async()=>({}),action:async()=>({})};
 assert.throws(()=>createSdk377Gateway({runtime,token,host:'0.0.0.0'}),/loopback/);
 assert.throws(()=>createSdk377Gateway({runtime,token:'short'}),/token/);
});
test('gateway refuses unauthenticated state and action, does not fabricate unavailable SDK state',async()=>{
 let calls=0;
 const runtime={getSdkState:async()=>{throw new Error('not observed')},action:async a=>{calls++;return {status:'dispatched_unverified',type:a.type}}};
 const gateway=createSdk377Gateway({runtime,token});
 await gateway.listen(19377);
 try{
  const url='http://127.0.0.1:19377';
  const unauth=await fetch(url+'/sdk_state');assert.equal(unauth.status,401);
  const headers={authorization:'Bearer '+token};
  const unavailable=await fetch(url+'/sdk_state',{headers});assert.equal(unavailable.status,409);
  const denied=await fetch(url+'/sdk_action',{method:'POST',headers:{...headers,'content-type':'application/json'},body:'{"action":{"type":"teleport"}}'});
  assert.equal(denied.status,200);assert.equal(calls,1);
  const invalid=await fetch(url+'/sdk_action',{method:'POST',headers,body:'{"other":true}'});
  assert.equal(invalid.status,400);
 }finally{await gateway.close()}
});
