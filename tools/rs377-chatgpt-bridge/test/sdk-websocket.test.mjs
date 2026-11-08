import test from 'node:test';
import assert from 'node:assert/strict';
import {createSdk377WebSocket} from '../src/sdk-websocket.mjs';

const BOT='HarnessProbe', TOKEN='a'.repeat(64);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function harness(){
  let tick=10,position={x:3215,z:3215},actions=0;
  return {
    runtime:{
      async observe(){return {tick:tick++,position:{...position},
        world:{instanceId:'isolated-source-contract'},player:{username:BOT}};},
      async getSdkState(){throw new Error('required native SDK fields missing')},
      async action(action){actions++;
        if(action.type==='walkTo')position={x:action.x,z:action.z};
        return {status:'dispatched_unverified',opcode:28,tick:tick++};}
    },
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
const connect=q=>q.send({type:'sdk_connect',username:BOT,password:TOKEN,clientId:'isolated-spec-test',mode:'control'});
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
  }finally{q.ws.close();await gateway.close()}
});
test('refuse wrong authentication and do not preempt an active controller',async()=>{
  const h=harness(),gateway=createSdk377WebSocket({runtime:h.runtime,token:TOKEN,botName:BOT});
  const info=await gateway.listen(0);
  const wrong=await socket(info.port),first=await socket(info.port),second=await socket(info.port);
  try{
    wrong.send({type:'sdk_connect',username:BOT,password:'invalid',clientId:'bad',mode:'control'});
    await new Promise((resolve,reject)=>{
      const t=setTimeout(()=>reject(new Error('unauthenticated WS not closed')),3000);
      wrong.ws.addEventListener('close',()=>{clearTimeout(t);resolve()},{once:true})
    });
    connect(first);await take(first,m=>m.type==='sdk_connected');
    connect(second);
    const conflict=await take(second,m=>m.type==='sdk_error');
    assert.equal(conflict.error,'another controller connected');
    await sleep(80);
    assert.equal(h.count(),0);
  }finally{wrong.ws.close();first.ws.close();second.ws.close();await gateway.close()}
});
test('refuse remote host and weak tokens',()=>{
 const h=harness();
 assert.throws(()=>createSdk377WebSocket({runtime:h.runtime,token:'short',botName:BOT}),/strong/);
 assert.throws(()=>createSdk377WebSocket({runtime:h.runtime,token:TOKEN,botName:BOT,host:'0.0.0.0'}),/loopback/);
 assert.throws(()=>createSdk377WebSocket({runtime:h.runtime,token:TOKEN,botName:'Elrothiro'}),/disposable/);
});


const pinned='MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
const completeFixtureState=tick=>({
 tick,inGame:true,player:{name:BOT},skills:Array.from({length:21},()=>({name:'fixture'})),
 inventory:[],equipment:[],nearbyNpcs:[],nearbyPlayers:[],nearbyLocs:[],
 groundItems:[],gameMessages:[],recentDialogs:[],dialog:{isOpen:false,options:[],isWaiting:false},
 interface:{isOpen:false,interfaceId:-1,options:[]},shop:{isOpen:false},
 bank:{isOpen:false},modalOpen:false,modalInterface:-1,combatEvents:[],prayers:{activePrayers:[]}
});
test('SDK receives distinct authoritative states as real ticks advance, and no ticks after controller closes',async()=>{
 let tick=20,readCount=0;
 const runtime={
  ...harness().runtime,
  async getSdkState(){
   readCount++;
   return {state:completeFixtureState(tick),source:{contract:pinned,tick}};
  }
 };
 const gateway=createSdk377WebSocket({runtime,token:TOKEN,botName:BOT,stateIntervalMs:100});
 const {port}=await gateway.listen(0), q=await socket(port);
 try {
  connect(q);
  await take(q,m=>m.type==='sdk_connected');
  await take(q,m=>m.type==='sdk_state'&&m.state.tick===20);
  assert.equal(q.messages.filter(m=>m.type==='sdk_state').length,1,'initial real tick once');
  await sleep(270);
  assert.equal(q.messages.filter(m=>m.type==='sdk_state').length,1,'never synthesize advancing time');
  tick=21;
  await take(q,m=>m.type==='sdk_state'&&m.state.tick===21);
  assert.equal(q.messages.filter(m=>m.type==='sdk_state').length,2,'new tick delivered');
  q.ws.close();
  await sleep(150);
  const calls=readCount;
  await sleep(290);
  assert.equal(readCount,calls,'closed controller must stop polling its native observer');
 }finally{q.ws.close();await gateway.close()}
});
test('state streaming refuses partial SDK payloads, recovers when a complete native state becomes available',async()=>{
 let tick=40,complete=false;
 const runtime={
  ...harness().runtime,
  async getSdkState(){
   if(!complete)return {state:{tick,inGame:true,player:{name:BOT}},source:{tick,contract:pinned}};
   return {state:completeFixtureState(tick),source:{tick,contract:pinned}};
  }
 };
 const gateway=createSdk377WebSocket({runtime,token:TOKEN,botName:BOT,stateIntervalMs:100});
 const {port}=await gateway.listen(0),q=await socket(port);
 try{
  connect(q);await take(q,m=>m.type==='sdk_connected');
  await take(q,m=>m.type==='sdk_error'&&m.error==='authoritative_sdk_state_incomplete');
  await sleep(250);
  assert.equal(q.messages.some(m=>m.type==='sdk_state'),false,'never publish partial SDK state');
  assert.equal(q.messages.filter(m=>m.type==='sdk_error').length,1,'no repeated error flood');
  complete=true;tick=41;
  await take(q,m=>m.type==='sdk_state'&&m.state.tick===41);
  assert.equal(q.messages.filter(m=>m.type==='sdk_error').length,1);
 }finally{q.ws.close();await gateway.close()}
});
test('invalid state polling intervals and wrong bot origin fail closed',async()=>{
 const h=harness();
 assert.throws(()=>createSdk377WebSocket({runtime:h.runtime,token:TOKEN,botName:BOT,stateIntervalMs:3}),/invalid_state_interval/);
 const runtime={...h.runtime,async getSdkState(){
  return {state:completeFixtureState(100),source:{tick:100,contract:pinned}};
 }};
 const gw=createSdk377WebSocket({runtime,token:TOKEN,botName:'HarnessOther',stateIntervalMs:100});
 const {port}=await gw.listen(0),q=await socket(port);
 try{
  q.send({type:'sdk_connect',username:'HarnessOther',password:TOKEN,clientId:'fixture',mode:'control'});
  await take(q,m=>m.type==='sdk_error'&&m.error==='authoritative_sdk_state_incomplete');
  assert.equal(q.messages.some(m=>m.type==='sdk_state'),false,'never deliver another bot state');
 }finally{q.ws.close();await gw.close()}
});
