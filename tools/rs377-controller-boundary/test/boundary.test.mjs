import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {action,snapshot} from '../lib/guard.mjs';
import {performObserved} from '../lib/outcomes.mjs';
import {ReplayLedger,backoff} from '../lib/recovery.mjs';
import {DeterministicGoalExecutor} from '../lib/executor.mjs';
import {BoundaryController,TOOL_SCHEMAS,resolveTool} from '../lib/controller.mjs';
import {createLoopbackGateway} from '../lib/gateway.mjs';
const BOT='HarnessTest',WORLD='isolated-harness-01';
const base=()=>({observedAtMs:Date.now(),world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:WORLD},tick:100,player:{username:BOT,isBot:true,x:3200,z:3200,plane:0,inventory:[{slot:0,id:12,quantity:1}],xp:{Woodcutting:0},questStages:{cooks_assistant:0},dialogue:null}});
function fake({dispatch=true,change=true,ticks=true}={}){
  let data=base();let count=0;
  return {get count(){return count},async observe(){return structuredClone(data)},async dispatch(a){count++;if(!dispatch)return {accepted:false};if(ticks)data.tick++;if(change){if(a.type==='walk'){data.player.x=a.x;data.player.z=a.z;}if(a.type==='ground_take'){data.player.inventory.push({slot:1,id:a.itemId,quantity:1})}if(a.type==='npc_option')data.player.dialogue={text:'hello'};}return {accepted:true}},change(fn){fn(data)}};
}
async function ledger(t){const dir=await mkdtemp(path.join(os.tmpdir(),'joshrs-lease-'));t.after(()=>rm(dir,{recursive:true,force:true}));return new ReplayLedger(path.join(dir,'journal.json')).load();}
test('strict allowlist: grants, unknown keys and invalid coordinates refused',()=>{
  assert.throws(()=>action({type:'teleport',x:5,z:5}),/forbidden/);
  assert.throws(()=>action({type:'walk',x:3201,z:3202,admin:true}),/unexpected/);
  assert.throws(()=>action({type:'wait',ticks:999}),/invalid/);
  assert.throws(()=>action({type:'walk',x:-1,z:3}),/invalid/);
  assert.equal(action({type:'walk',x:3210,z:3200}).x,3210);
});
test('isolated revision-377 identity and profile are mandatory',()=>{
  let s=base();s.world.mode='family';assert.throws(()=>snapshot(s,BOT,WORLD),/untrusted_world/);
  s=base();s.player.username='Elrothiro';assert.throws(()=>snapshot(s,BOT,WORLD),/untrusted_bot/);
  assert.equal(snapshot(base(),BOT,WORLD).player.username,BOT);
});
test('observed movement requires matching destination and later tick',async()=>{
  let r=await performObserved(fake(),{type:'walk',x:3210,z:3210},{botName:BOT,worldId:WORLD,timeoutMs:20,pollMs:1});assert.equal(r.status,'observed');assert.equal(r.evidence,'destination_reached');
  r=await performObserved(fake({change:false}),{type:'walk',x:3210,z:3210},{botName:BOT,worldId:WORLD,timeoutMs:8,pollMs:1});assert.equal(r.status,'unverified');
});
test('unrelated state changes do not count and no new tick is timeout',async()=>{
  let f=fake({change:false,ticks:true});f.change(s=>s.player.x=3203);
  let r=await performObserved(f,{type:'ground_take',x:1,z:1,itemId:5},{botName:BOT,worldId:WORLD,timeoutMs:8,pollMs:1});assert.equal(r.status,'unverified');
  r=await performObserved(fake({change:false,ticks:false}),{type:'walk',x:20,z:20},{botName:BOT,worldId:WORLD,timeoutMs:8,pollMs:1});assert.equal(r.status,'timeout');
});
test('rejected action never dispatches; denied transport never success',async()=>{
  const f=fake();let r=await performObserved(f,{type:'give_item',itemId:1},{botName:BOT,worldId:WORLD});assert.equal(r.status,'rejected');assert.equal(f.count,0);
  r=await performObserved(fake({dispatch:false}),{type:'walk',x:2,z:2},{botName:BOT,worldId:WORLD});assert.equal(r.status,'rejected');
});
test('cancellation works before dispatch and during bounded polling',async()=>{
  const ac=new AbortController();ac.abort();const f=fake();let r=await performObserved(f,{type:'walk',x:2,z:2},{botName:BOT,worldId:WORLD,signal:ac.signal});assert.equal(r.status,'cancelled');assert.equal(f.count,0);
  const second=new AbortController();r=await performObserved(fake({change:false}),{type:'wait',ticks:2},{botName:BOT,worldId:WORLD,timeoutMs:400,signal:second.signal,pollMs:1,onDispatch:()=>second.abort()});assert.equal(r.status,'cancelled');
});
test('recovery cap and no unbounded retry',()=>{assert.equal(backoff(0),250);assert.equal(backoff(4),4000);assert.equal(backoff(5),null);assert.equal(backoff(999),null);});
test('durable replay ledger rejects duplicate IDs and crash-marked uncertain actions',async t=>{
  const j=await ledger(t);j.openSession('first');await j.reserve('item_pickup_1',{type:'ground_take'});await j.finish('item_pickup_1','sent');
  assert.equal(j.get('item_pickup_1').replaySafe,false);j.closeSession('first');
  const reloaded=await new ReplayLedger(j.file).load();assert.equal(reloaded.get('item_pickup_1').status,'unverified');reloaded.openSession('second');
  await assert.rejects(()=>reloaded.reserve('item_pickup_1',{type:'ground_take'}),/replay_denied/);
  assert.throws(()=>reloaded.openSession('third'),/duplicate_session/);
  const stat=await import('node:fs/promises').then(fs=>fs.stat(j.file));assert.equal(stat.mode&0o077,0);
});
test('ledger fails on malformed persisted journal rather than dropping history',async t=>{
  const j=await ledger(t);await writeFile(j.file,'{broken json');await assert.rejects(()=>new ReplayLedger(j.file).load());
});
test('deterministic executor limits planner frequency, grants and tick floods',()=>{
  const e=new DeterministicGoalExecutor({minimumPlanTicks:10});
  assert.equal(e.propose({steps:[{type:'walk',x:2,z:2}]},100).accepted,true);
  assert.equal(e.next(100).action.type,'walk');assert.equal(e.next(100),null);
  assert.equal(e.record({status:'observed'}),'completed');
  assert.equal(e.propose({steps:[{type:'wait',ticks:1}]},105).accepted,false);
  assert.equal(e.propose({steps:[{type:'teleport',x:9,z:9}]},110).accepted,false);
  assert.equal(e.propose({steps:[{type:'wait',ticks:1}]},110).accepted,true);
  assert.equal(e.next(110).action.type,'wait');assert.equal(e.record({status:'unverified'}),'blocked');
  assert.equal(e.next(111),null);e.stop();assert.equal(e.summary().state,'stopped');
});
test('provider-neutral typed tool list has no shell, JS, code or privileged operations',()=>{
  assert.deepEqual(TOOL_SCHEMAS.map(x=>x.name),['observe','walk','npc_option','loc_option','ground_take','inventory_option','item_on_loc','dialog_option','wait','stop','report']);
  assert.throws(()=>resolveTool('execute_code',{code:'process.exit()'}));
  assert.deepEqual(resolveTool('walk',{x:2,z:3}),{type:'walk',x:2,z:3});
  assert.throws(()=>resolveTool('walk',{x:2,z:3,shell:'pwd'}));
});
test('only one lease; rate limiting, action journal and stop',async t=>{
  const j=await ledger(t),f=fake(),c=new BoundaryController({transport:f,ledger:j,botName:BOT,worldId:WORLD,maxActionsPerMinute:2});
  const one=await c.claim();await assert.rejects(()=>c.claim(),/controller_busy/);
  assert.equal((await c.run(one.lease,'walk_test_1',{type:'walk',x:3205,z:3205})).status,'observed');
  await assert.rejects(()=>c.run('wrong_lease','walk_test_2',{type:'walk',x:1,z:1}),/lease_required/);
  await assert.rejects(()=>c.run(one.lease,'walk_test_1',{type:'walk',x:3207,z:3207}),/replay_denied|tick_rate_limited/);
  assert.equal(c.stop(one.lease).stopped,true);assert.equal(c.status().leaseOccupied,false);
  await assert.rejects(()=>c.run(one.lease,'walk_test_3',{type:'wait',ticks:1}),/lease_required/);
});
test('HTTP gateway is loopback-bound and authentication is required',async t=>{
  const j=await ledger(t),c=new BoundaryController({transport:fake(),ledger:j,botName:BOT,worldId:WORLD});
  assert.throws(()=>createLoopbackGateway(c,{authToken:'weak'}),/strong_gateway_token/);
  const authToken='example-test-only-strong-random-placeholder-0001';
  const g=createLoopbackGateway(c,{authToken});const started=await g.start();t.after(()=>g.close());
  assert.equal(started.host,'127.0.0.1');
  const call=async(endpoint,body={},headers={})=>fetch(`http://127.0.0.1:${started.port}${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  let r=await call('/status');assert.equal(r.status,401);
  r=await call('/status',{}, {Authorization:`Bearer ${authToken}`,Origin:'https://evil.example'});assert.equal(r.status,403);
  r=await call('/status',{}, {Authorization:`Bearer ${authToken}`});assert.equal(r.status,200);
  r=await call('/claim',{}, {Authorization:`Bearer ${authToken}`});assert.equal(r.status,200);const lease=(await r.json()).data.lease;
  r=await call('/act',{lease,tool:'walk',args:{x:3205,z:3205},actionId:'http_walk_001'}, {Authorization:`Bearer ${authToken}`});assert.equal(r.status,200);assert.equal((await r.json()).data.status,'observed');
  r=await call('/report',{lease,actionId:'http_walk_001'}, {Authorization:`Bearer ${authToken}`});assert.equal((await r.json()).data.status,'observed');
  r=await call('/stop',{lease}, {Authorization:`Bearer ${authToken}`});assert.equal((await r.json()).data.stopped,true);
});
test('bounded reconnect only retries session creation; stops on wrong world and auth failures',async()=>{
  const {BoundedReconnect}=await import('../lib/recovery.mjs');let delays=[],tries=0,closed=0;
  let r=new BoundedReconnect({maxRetries:3,baseMs:5,maxMs:50,sleep:async n=>delays.push(n)});
  let x=await r.reconnect(async()=>{tries++;if(tries<3)throw Error('network');return {close:async()=>closed++};});
  assert.deepEqual(x,{status:'connected',attempts:3});assert.deepEqual(delays,[5,10]);
  await assert.rejects(()=>r.reconnect(async()=>({close(){}})),/duplicate_connection/);
  await r.close();assert.equal(closed,1);
  r=new BoundedReconnect({maxRetries:3,sleep:async()=>{throw Error('not expected')}});
  x=await r.reconnect(async()=>{const e=Error('wrong');e.code='WRONG_WORLD';throw e});assert.equal(x.status,'blocked');assert.equal(x.attempts,1);
  r=new BoundedReconnect({maxRetries:2,sleep:async()=>{}});
  x=await r.reconnect(async()=>{throw Error('offline')});assert.equal(x.status,'exhausted');assert.equal(x.attempts,2);
});
test('concurrent lease claim and action requests never race past single-controller lock',async t=>{
  const j=await ledger(t),f=fake();const original=f.observe;
  f.observe=async()=>{await new Promise(r=>setTimeout(r,5));return original();};
  const c=new BoundaryController({transport:f,ledger:j,botName:BOT,worldId:WORLD});
  const [a,b]=await Promise.allSettled([c.claim(),c.claim()]);
  assert.equal([a,b].filter(x=>x.status==='fulfilled').length,1);
  const lease=[a,b].find(x=>x.status==='fulfilled').value.lease;
  const actions=await Promise.allSettled([
    c.run(lease,'race_move_01',{type:'walk',x:3201,z:3201}),
    c.run(lease,'race_move_02',{type:'walk',x:3202,z:3202})
  ]);
  assert.equal(actions.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(f.count,1);
});
test('function calling schemas contain strict integer params and no arbitrary exec tool',async()=>{
  const {MODEL_TOOL_DECLARATIONS}=await import('../lib/controller.mjs');
  assert.equal(MODEL_TOOL_DECLARATIONS.length,11);
  const move=MODEL_TOOL_DECLARATIONS.find(x=>x.name==='walk');
  assert.equal(move.parameters.additionalProperties,false);
  assert.deepEqual(move.parameters.required,['x','z']);
  assert.equal(move.parameters.properties.x.type,'integer');
  assert.equal(MODEL_TOOL_DECLARATIONS.some(x=>/exec|shell|script/i.test(x.name)),false);
});

test('stale or oversized observation rejected and external account fields stripped',()=>{
  let s=base();s.observedAtMs=Date.now()-4000;assert.throws(()=>snapshot(s,BOT,WORLD),/stale_observation/);
  s=base();s.otherPlayers=[{name:'Sylvie',privateMessages:['secret']}];s.player.accountPassword='NEVER_RETURN';
  let safe=snapshot(s,BOT,WORLD);assert.equal(safe.otherPlayers,undefined);assert.equal(safe.player.accountPassword,undefined);
  s=base();s.player.dialogue={data:'x'.repeat(50000)};assert.throws(()=>snapshot(s,BOT,WORLD),/oversize_observation/);
});
