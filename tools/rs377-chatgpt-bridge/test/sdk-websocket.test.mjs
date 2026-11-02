import test from 'node:test';
import assert from 'node:assert/strict';
import {createSdk377WebSocket} from '../src/sdk-websocket.mjs';

const BOT='HarnessProbe', TOKEN='a'.repeat(64);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function harness(){
  let tick=10,position={x:3215,z:3215,plane:0},actions=0;
  return {
    runtime:{
      async observe(){return {tick:tick++,position:{...position},
        world:{instanceId:'isolated-source-contract'},player:{username:BOT}};},
      async getSdkState(){throw new Error('required native SDK fields missing')},
      async action(action){actions++;
        if(action.type==='walkTo')position={x:action.x,z:action.z,plane:0};
        return {status:'dispatched_unverified',opcode:28,tick:tick++};}
    },
    setPosition:(p)=>{position=p},
    count:()=>actions
  };
}
async function socket(port) {
  const ws=new WebSocket('ws://127.0.0.1:'+port+'/gateway');
  const messages=[];
  ws.addEventListener('message',event=>{try{messages.push(JSON.parse(event.data))}catch{}});
  await new Promise((resolve,reject)=>{
    const guard=setTimeout(()=>reject(new Error('open timeout')),2500);
    ws.addEventListener('open',()=>{clearTimeout(guard);resolve()},{once:true});
    ws.addEventListener('error',()=>{clearTimeout(guard);reject(new Error('open failed'))},{once:true});
  });
  return {ws,messages,send:v=>ws.send(JSON.stringify(v))};
}
async function take(q,match,timeout=5500){
  const until=Date.now()+timeout;
  while(Date.now()<until){const found=q.messages.find(match);if(found)return found;await sleep(35)}
  throw new Error('Expected pinned SDK message missing');
}
const connect=(q,mode='control')=>q.send({type:'sdk_connect',username:BOT,password:TOKEN,clientId:'isolated-spec-test',mode});
test('pin sdk_connect → sdk_connected, no fabricated sdk_state, actual completion envelope',async()=>{
  const h=harness(),gateway=createSdk377WebSocket({runtime:h.runtime,token:TOKEN,botName:BOT});
  const info=await gateway.listen(0);const q=await socket(info.port);
  try{
    connect(q);
    assert.equal((await take(q,m=>m.type==='sdk_connected')).success,true);
    await take(q,m=>m.type==='sdk_error'&&m.error==='authoritative_sdk_state_incomplete');
    assert.equal(q.messages.some(m=>m.type==='sdk_state'),false);
    q.send({type:'sdk_action',username:BOT,actionId:'genuine-1',
      action:{type:'walkTo',x:3216,z:3215,reason:'fixture only'}});
    const res=await take(q,m=>m.type==='sdk_action_result'&&m.actionId==='genuine-1');
    assert.equal(res.result.success,true);
    assert.equal(res.result.phase,'completion');
    assert.equal(res.result.data.verifiedEffect,true);
    assert.equal(h.count(),1);

    // Issue 5: replayed actionId must be refused without dispatching again
    q.messages.length=0;
    q.send({type:'sdk_action',username:BOT,actionId:'genuine-1',
      action:{type:'walkTo',x:3217,z:3215,reason:'replayed actionId'}});
    const replayRes=await take(q,m=>m.type==='sdk_action_result'&&m.actionId==='genuine-1');
    assert.equal(replayRes.result.success,false);
    assert.equal(replayRes.result.reason,'replay');
    assert.equal(h.count(),1);
  }finally{q.ws.close();await gateway.close()}
});
test('refuse wrong authentication, do not preempt an active controller, and block actions from observe-only clients',async()=>{
  const h=harness(),gateway=createSdk377WebSocket({runtime:h.runtime,token:TOKEN,botName:BOT});
  const info=await gateway.listen(0);
  const wrong=await socket(info.port),first=await socket(info.port),second=await socket(info.port),observerClient=await socket(info.port);
  try{
    wrong.send({type:'sdk_connect',username:BOT,password:'invalid',clientId:'bad',mode:'control'});
    await new Promise((resolve,reject)=>{
      const t=setTimeout(()=>reject(new Error('unauthenticated WS not closed')),3000);
      wrong.ws.addEventListener('close',()=>{clearTimeout(t);resolve()},{once:true})
    });
    connect(first,'control');await take(first,m=>m.type==='sdk_connected');
    connect(second,'control');
    const conflict=await take(second,m=>m.type==='sdk_error');
    assert.equal(conflict.error,'another controller connected');

    // Issue 6: observe-mode client can connect without preempting controller, but cannot send sdk_action
    connect(observerClient,'observe');
    await take(observerClient,m=>m.type==='sdk_connected');
    observerClient.send({type:'sdk_action',username:BOT,actionId:'obs-act-1',
      action:{type:'walkTo',x:3216,z:3215,reason:'observe client action attempt'}});
    const obsActionRes=await take(observerClient,m=>m.type==='sdk_action_result'&&m.actionId==='obs-act-1');
    assert.equal(obsActionRes.result.success,false);
    assert.equal(obsActionRes.result.reason,'observe_only');
    assert.equal(h.count(),0);
  }finally{wrong.ws.close();first.ws.close();second.ws.close();observerClient.ws.close();await gateway.close()}
});
test('Issue 4: WebSocket gateway rejects partial blocked movement and wrong plane on walkTo',async()=>{
  let tick=100;
  let pos={x:3200,z:3200,plane:0};
  const runtime={
    async observe(){return {tick:tick++,position:{...pos},world:{instanceId:'isolated-source-contract'},player:{username:BOT}}},
    async getSdkState(){throw new Error('incomplete')},
    async action(action){
      if(action.type==='walkTo'&&action.x===3205){
        // Simulate partial movement that stops at 3201, 3200
        pos={x:3201,z:3200,plane:0};
      }else if(action.type==='walkTo'&&action.x===3206){
        // Simulate ending on wrong plane
        pos={x:3206,z:3200,plane:1};
      }
      return {status:'dispatched_unverified',opcode:28,tick:tick++};
    }
  };
  const gateway=createSdk377WebSocket({runtime,token:TOKEN,botName:BOT,pollIntervalMs:20,actionTimeoutMs:1000});
  const info=await gateway.listen(0);
  const q=await socket(info.port);
  try{
    connect(q,'control');
    await take(q,m=>m.type==='sdk_connected');
    q.send({type:'sdk_action',username:BOT,actionId:'partial-1',
      action:{type:'walkTo',x:3205,z:3200,reason:'blocked walk'}});
    const r1=await take(q,m=>m.type==='sdk_action_result'&&m.actionId==='partial-1');
    assert.equal(r1.result.success,false);
    assert.equal(r1.result.reason,'partial_movement_blocked');

    q.send({type:'sdk_action',username:BOT,actionId:'plane-1',
      action:{type:'walkTo',x:3206,z:3200,reason:'wrong plane walk'}});
    const r2=await take(q,m=>m.type==='sdk_action_result'&&m.actionId==='plane-1');
    assert.equal(r2.result.success,false);
    assert.equal(r2.result.reason,'wrong_plane');
  }finally{q.ws.close();await gateway.close()}
});
test('refuse remote host and weak tokens',()=>{
 const h=harness();
 assert.throws(()=>createSdk377WebSocket({runtime:h.runtime,token:'short',botName:BOT}),/strong/);
 assert.throws(()=>createSdk377WebSocket({runtime:h.runtime,token:TOKEN,botName:BOT,host:'0.0.0.0'}),/loopback/);
 assert.throws(()=>createSdk377WebSocket({runtime:h.runtime,token:TOKEN,botName:'Elrothiro'}),/disposable/);
});
