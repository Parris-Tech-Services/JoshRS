import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import http from 'node:http';
import {generateKeyPairSync} from 'node:crypto';
import {once} from 'node:events';
import {Session377} from '../../rs377-chatgpt-bridge/src/session.mjs';
import {buildLogin} from '../../rs377-chatgpt-bridge/src/protocol.mjs';
import {SKILLS377} from '../../rs377-chatgpt-bridge/src/observation.mjs';
import {Native377BoundaryTransport,startAuthenticated377Gateway,createLoopbackEngine377Source} from '../lib/native377-transport.mjs';
import {BoundaryController} from '../lib/controller.mjs';
import {ReplayLedger} from '../lib/recovery.mjs';
import {createLoopbackGateway} from '../lib/gateway.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';

const WORLD='isolated-harness-native-01',BOT='HarnessBot',TOKEN='fixture-observer-private-token-32chars-000001';
const key=generateKeyPairSync('rsa',{modulusLength:1024}).publicKey.export({type:'spki',format:'pem'});
function native(tick){
  return {
    world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,
      instanceId:WORLD,sourceSha:'a'.repeat(40)},
    player:{username:BOT,isBot:true},tick,position:{x:3200,z:3200,plane:0},
    skills:SKILLS377.map(name=>({name,level:1,baseLevel:1,xpTenths:0})),
    inventory:[{slot:0,id:1351,count:1}],equipment:[],nearbyNpcs:[],
    nearbyLocs:[],groundItems:[],dialogue:null,questStages:{cooks_assistant:0},sdkDetails:null
  };
}
function source({token=TOKEN,advance=true,wrongBot=false}={}){
  let seq=0;return {read:async()=>{
    seq++;const state=native(advance?100+seq:100);
    if(wrongBot)state.player.username='Elrothiro';
    return {token,sequence:seq,observation:state};
  }};
}
async function simulatedTcp(t){
  let packets=[];
  const sockets=new Set();
  const tcp=net.createServer(s=>{
    sockets.add(s);s.on('close',()=>sockets.delete(s));
    let stage=0;
    s.on('data',b=>{
      packets.push(Buffer.from(b));
      if(stage===0){stage++;s.write(Buffer.alloc(17));}
      else if(stage===1){stage++;s.write(Buffer.from([2,0,1]));}
    });
  });
  tcp.listen(0,'127.0.0.1');await once(tcp,'listening');
  t.after(async()=>{for(const socket of sockets)socket.destroy();await new Promise(resolve=>tcp.close(resolve));});
  const port=tcp.address().port;
  // Diagnose native codec errors independently before the network protocol.
  const encoded=buildLogin({username:BOT,password:'test-password',publicKeyPem:key,crcs:Buffer.alloc(36,7),seed:[1,2,3,4]});
  assert.equal(encoded.packet.readUInt16BE(3),377);
  const session=new Session377({target:{host:'127.0.0.1',port},username:BOT,
    password:'test-password',publicKeyPem:key,crcs:Buffer.alloc(36,7),
    timeoutMs:2000,seedFactory:()=>[1,2,3,4]});
  return {packets,session};
}
const adapter=(session,src=source())=>new Native377BoundaryTransport({
  session,nativeSource:src,observerToken:TOKEN,botName:BOT,worldId:WORLD,
  proofTimeoutMs:1000
});
test('gateway real Node TCP hello/login integration then only normal encrypted movement',async t=>{
  const tcp=await simulatedTcp(t),b=adapter(tcp.session);
  assert.equal(b.status().authenticated,false);
  await assert.rejects(()=>b.observe(),/native_not_authenticated/);
  await assert.rejects(()=>b.dispatch({type:'walk',x:3201,z:3201}),/native_not_authenticated/);
  const status=await b.connect();
  assert.equal(status.authenticated,true);
  assert.equal(status.worldRevision,377);
  assert.deepEqual([...tcp.packets[0]],[14,0]);
  assert.equal(tcp.packets[1].readUInt16BE(3),377);
  assert.equal((await b.observe()).player.username,BOT);
  const reply=await b.dispatch({type:'walk',x:3201,z:3201});
  assert.equal(reply.accepted,true);
  assert.equal(reply.phase,'dispatch_only');
  await new Promise(r=>setTimeout(r,30));
  assert.ok(tcp.packets.length>=3);
  assert.equal(tcp.packets[2].length,7); // ISAAC-encrypted opcode + variable length + 5 bytes
  assert.deepEqual([...tcp.packets[2].subarray(1)],[5,1,12,0,1,12]);
  assert.equal(b.status().authenticated,true);
  b.close();
  assert.equal(b.status().authenticated,false);
  await assert.rejects(()=>b.dispatch({type:'walk',x:3202,z:3202}),/native_not_authenticated/);
});
test('missing authenticated observer fails closed and terminates real session',async t=>{
  const tcp=await simulatedTcp(t);
  const b=adapter(tcp.session,source({token:'wrong-token'}));
  await assert.rejects(()=>b.connect(),/unauthenticated_native_observation/);
  assert.equal(tcp.session.status().authenticated,false);
  assert.equal(b.status().authenticated,false);
});
test('wrong bot and no tick progress both refuse authenticated gateway readiness',async t=>{
  const a=await simulatedTcp(t);
  await assert.rejects(()=>adapter(a.session,source({wrongBot:true})).connect(),/wrong identity/);
  const b=await simulatedTcp(t);
  await assert.rejects(()=>adapter(b.session,source({advance:false})).connect(),/no_advancing_authenticated_game_ticks/);
  assert.equal(b.session.status().authenticated,false);
});
test('normal 377 adapter rejects unobserved targets, unverified dialogue and cheats',async t=>{
  const tcp=await simulatedTcp(t),b=adapter(tcp.session);await b.connect();
  const count=()=>tcp.packets.length;
  for(const raw of [
    {type:'npc_option',npcIndex:99,option:1},
    {type:'loc_option',x:3200,z:3200,locId:4,option:1},
    {type:'ground_take',x:3200,z:3200,itemId:4},
    {type:'dialog_option',option:1},
    {type:'teleport',x:3201,z:3201},
    {type:'walk',x:5000,z:5000}
  ])await assert.rejects(()=>b.dispatch(raw));
  assert.equal(count(),2); // hello + login, no illegal packet
  b.close();
});
test('HTTP gateway plus native auth requires lease and does not fake moved state',async t=>{
  const tcp=await simulatedTcp(t),b=adapter(tcp.session);await b.connect();
  const dir=await mkdtemp(path.join(os.tmpdir(),'rs377-native-boundary-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const ledger=await new ReplayLedger(path.join(dir,'journal.json')).load();
  const c=new BoundaryController({transport:b,botName:BOT,worldId:WORLD,ledger});
  const gw=createLoopbackGateway(c,{authToken:'test-only-long-bearer-token-32-bytes-12345'});
  const {port}=await gw.start();t.after(()=>gw.close());t.after(()=>b.close());
  const call=(path,data,token='test-only-long-bearer-token-32-bytes-12345')=>
    fetch('http://127.0.0.1:'+port+path,{method:'POST',headers:{
      Authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(data)});
  assert.equal((await call('/claim',{},'wrong')).status,401);
  const claimed=await call('/claim',{});assert.equal(claimed.status,200);
  const lease=(await claimed.json()).data.lease;
  assert.equal((await call('/act',{lease:'wrong',actionId:'packet_walk_01',tool:'walk',
    args:{x:3201,z:3201}})).status,409);
  const response=await call('/act',{lease,actionId:'packet_walk_01',tool:'walk',
    args:{x:3201,z:3201},timeoutMs:25});
  assert.equal(response.status,200);
  const result=(await response.json()).data;
  assert.equal(result.status,'timeout'); // 25ms cannot prove a 600ms game tick or movement
  assert.equal(result.dispatched,true);
  const replay=await call('/act',{lease,actionId:'packet_walk_01',tool:'walk',
    args:{x:3201,z:3201}});
  assert.equal(replay.status,409);
});

test('production gateway entrypoint cannot bind before native authentication',async t=>{
  const tcp=await simulatedTcp(t),b=adapter(tcp.session);
  const dir=await mkdtemp(path.join(os.tmpdir(),'rs377-gateway-init-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const ledger=await new ReplayLedger(path.join(dir,'journal.json')).load();
  const authToken='test-only-token-32-bytes-very-long-placeholder';
  await assert.rejects(()=>startAuthenticated377Gateway({transport:b,ledger,authToken}),
    /native_auth_and_fresh_ticks_required/);
  assert.equal(tcp.packets.length,0);
  await b.connect();
  const gateway=await startAuthenticated377Gateway({transport:b,ledger,authToken});
  t.after(()=>gateway.close());
  assert.equal(gateway.address.host,'127.0.0.1');
  const resp=await fetch('http://127.0.0.1:'+gateway.address.port+'/claim',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+authToken},
    body:'{}'});
  assert.equal(resp.status,200);
  const data=await resp.json();
  assert.equal(data.data.botName,BOT);
  assert.equal(data.data.worldId,WORLD);
});

test('task24 Engine-TS HTTP endpoint interoperates with gateway without inventing XP or quests',async t=>{
  const tcp=await simulatedTcp(t);
  let tick=300,requests=0;
  const clock=setInterval(()=>tick++,600);t.after(()=>clearInterval(clock));
  const engine=http.createServer((req,res)=>{
    requests++;
    if(req.method!=='GET'||req.url!=='/dev/rs377-observe'||req.headers.authorization!=='Bearer '+TOKEN){
      res.writeHead(404);res.end();return;
    }
    const data=native(tick);data.skills=null;data.questStages=null;
    data.equipment=null;data.nearbyNpcs=null;data.nearbyLocs=null;data.groundItems=null;
    res.writeHead(200,{'content-type':'application/json'});
    res.end(JSON.stringify({token:TOKEN,sequence:tick,observation:data}));
  });
  engine.listen(0,'127.0.0.1');await once(engine,'listening');
  t.after(()=>new Promise(resolve=>engine.close(resolve)));
  const port=engine.address().port;
  assert.throws(()=>createLoopbackEngine377Source({port:8888,token:TOKEN}),/port/);
  assert.throws(()=>createLoopbackEngine377Source({port,token:'short'}),/token/);
  const nativeSource=createLoopbackEngine377Source({port,token:TOKEN});
  const b=adapter(tcp.session,nativeSource);
  await b.connect();
  const observation=await b.observe();
  assert.equal(observation.tick>=300,true);
  assert.equal(observation.player.xp,null);
  assert.equal(observation.player.questStages,null);
  assert.equal(observation.player.inventory[0].id,1351);
  assert.ok(requests>=2); // advancing actual 600ms timer, not repeated fake sequencer
  b.close();
});
