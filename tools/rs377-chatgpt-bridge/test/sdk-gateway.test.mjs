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
  // Replay protection on HTTP actionId
  const a1=await fetch(url+'/sdk_action',{method:'POST',headers:{...headers,'content-type':'application/json'},body:'{"actionId":"act-1","action":{"type":"none","reason":"noop"}}'});
  assert.equal(a1.status,200);
  const a1Replay=await fetch(url+'/sdk_action',{method:'POST',headers:{...headers,'content-type':'application/json'},body:'{"actionId":"act-1","action":{"type":"none","reason":"noop"}}'});
  assert.equal(a1Replay.status,409);
  // Wrong bot identity rejected
  const wrongBot=await fetch(url+'/sdk_action',{method:'POST',headers:{...headers,'content-type':'application/json'},body:'{"username":"Elrothiro","action":{"type":"none","reason":"noop"}}'});
  assert.equal(wrongBot.status,403);
 }finally{await gateway.close()}
});
test('gateway WebSocket protocol enforces sdk_connect auth, bot binding, observe-mode block, and actionId replay protection',async()=>{
 const fakeState={tick:42,inGame:true,player:{name:'HarnessBot',x:3222,z:3218,worldX:3222,worldZ:3218,level:0}};
 const runtime={
  getSdkState:async()=>({state:fakeState,source:{instanceId:'isolated-test-world'}}),
  action:async()=>({status:'dispatched_unverified',verifiedEffect:false}),
  executeVerifiedAction:async a=>({
   status:a.type==='walkTo'?'verified_success':'rejected',
   verifiedEffect:a.type==='walkTo',
   tick:42,
   observedTick:43,
   sdkResult:{success:a.type==='walkTo',message:'ok',phase:'completion'}
  })
 };
 const gateway=createSdk377Gateway({runtime,token,botName:'HarnessBot',expectedWorld:'isolated-test-world'});
 await gateway.listen(19378);
 try{
  const wsUrl='ws://127.0.0.1:19378';
  const sendAndNext=(ws,payload)=>new Promise((resolve,reject)=>{
   const t=setTimeout(()=>reject(new Error('ws timeout')),2000);
   ws.addEventListener('message',ev=>{clearTimeout(t);resolve(JSON.parse(String(ev.data)))},{once:true});
   ws.send(JSON.stringify(payload));
  });
  // 1) Wrong bot identity rejected on sdk_connect
  const badWs=new WebSocket(wsUrl);
  await new Promise(r=>badWs.addEventListener('open',r,{once:true}));
  const badConn=await sendAndNext(badWs,{type:'sdk_connect',username:'Elrothiro',password:token,mode:'control'});
  assert.equal(badConn.type,'sdk_connected');
  assert.equal(badConn.success,false);
  badWs.close();

  // 2) Observe-only connection receives state but cannot send actions
  const obsWs=new WebSocket(wsUrl);
  await new Promise(r=>obsWs.addEventListener('open',r,{once:true}));
  const obsMsgs=[];
  await new Promise((resolve,reject)=>{
   const t=setTimeout(()=>reject(new Error('obs timeout')),2000);
   obsWs.addEventListener('message',ev=>{
    obsMsgs.push(JSON.parse(String(ev.data)));
    if(obsMsgs.length>=2){clearTimeout(t);resolve();}
   });
   obsWs.send(JSON.stringify({type:'sdk_connect',username:'HarnessBot',password:token,mode:'observe'}));
  });
  assert.equal(obsMsgs[0].type,'sdk_connected');
  assert.equal(obsMsgs[0].mode,'observe');
  assert.equal(obsMsgs[1].type,'sdk_state');
  const obsAct=await sendAndNext(obsWs,{type:'sdk_action',username:'HarnessBot',actionId:'obs-1',action:{type:'say',message:'hi',reason:'chat'}});
  assert.equal(obsAct.type,'sdk_action_result');
  assert.equal(obsAct.result.success,false);
  assert.equal(obsAct.result.reason,'observe_only');
  obsWs.close();

  // 3) Control connection executes verified action and blocks replay
  const ctlWs=new WebSocket(wsUrl);
  await new Promise(r=>ctlWs.addEventListener('open',r,{once:true}));
  const ctlInit=[];
  await new Promise((resolve,reject)=>{
   const t=setTimeout(()=>reject(new Error('ctl timeout')),2000);
   ctlWs.addEventListener('message',ev=>{
    ctlInit.push(JSON.parse(String(ev.data)));
    if(ctlInit.length>=2){clearTimeout(t);resolve();}
   });
   ctlWs.send(JSON.stringify({type:'sdk_connect',username:'HarnessBot',password:token,mode:'control'}));
  });
  assert.equal(ctlInit[0].success,true);
  const actMsgs=[];
  await new Promise((resolve,reject)=>{
   const t=setTimeout(()=>reject(new Error('act timeout')),2000);
   ctlWs.addEventListener('message',ev=>{
    const m=JSON.parse(String(ev.data));
    actMsgs.push(m);
    if(m.type==='sdk_action_result'){clearTimeout(t);resolve();}
   });
   ctlWs.send(JSON.stringify({type:'sdk_action',username:'HarnessBot',actionId:'ctl-1',action:{type:'walkTo',x:3223,z:3218,reason:'step'}}));
  });
  const resMsg=actMsgs.find(m=>m.type==='sdk_action_result');
  assert.equal(resMsg.status,'verified_success');
  assert.equal(resMsg.result.success,true);

  const replayMsg=await sendAndNext(ctlWs,{type:'sdk_action',username:'HarnessBot',actionId:'ctl-1',action:{type:'walkTo',x:3223,z:3218,reason:'step'}});
  assert.equal(replayMsg.type,'sdk_action_result');
  assert.equal(replayMsg.result.reason,'replay_detected');
  ctlWs.close();
 }finally{await gateway.close()}
});
