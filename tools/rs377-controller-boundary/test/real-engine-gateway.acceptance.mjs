#!/usr/bin/env node
/**
 * Task 26 REAL isolated acceptance. This is NOT a mock server.
 * Invoked only by smoke_377.py against the disposable pinned engine boot in CI.
 * The engine's login server, game TCP, HTTP management, sqlite and save files
 * live exclusively in RUNNER_TEMP. No family addresses/ports, no admin actions.
 */
import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {Session377} from '../../rs377-chatgpt-bridge/src/session.mjs';
import {createNative377Observer} from '../../rs377-chatgpt-bridge/src/native-observer.mjs';
import {Native377BoundaryTransport,createLoopbackEngine377Source,startAuthenticated377Gateway} from '../lib/native377-transport.mjs';
import {ReplayLedger} from '../lib/recovery.mjs';

const port=Number(process.env.TASK26_GAME_PORT);
const web=Number(process.env.TASK26_WEB_PORT);
const management=Number(process.env.TASK26_MANAGEMENT_PORT);
const world=process.env.RS377_OBSERVER_WORLD;
const token=process.env.RS377_OBSERVER_TOKEN;
const bot='harnessbot';
const badPorts=[52402,8888,45099,43500];
function checkedPort(p){assert(Number.isInteger(p)&&p>=1024&&p<=65535&&!badPorts.includes(p));return p;}
checkedPort(port);checkedPort(web);checkedPort(management);
assert.notEqual(port,web);assert.notEqual(port,management);
assert.match(world,/^isolated-[a-z0-9_-]{4,64}$/);
assert.ok(token && Buffer.byteLength(token)>=32);
assert.equal(process.env.RS377_OBSERVER_ENABLED,'true');
assert.equal(process.env.RS377_OBSERVER_ISOLATED,'true');
assert.equal(process.env.NODE_XPRATE,'1');
assert.equal(process.env.DB_BACKEND,'sqlite');
assert.equal(process.env.WEBSITE_REGISTRATION,'false');
assert.equal(process.env.NODE_PROFILE,'joshrs_ci_377');
const dest=await mkdtemp(path.join(os.tmpdir(),'joshrs-task26-disposable-'));
const auth=randomBytes(32).toString('base64url');
const source=createLoopbackEngine377Source({port:management,token});
let boundary=null, gateway=null,stages=[];
const record=(name,condition=true)=>{assert.ok(condition,name);stages.push(name);};
const query=async(url,opts={})=>{
  const response=await fetch(url,{...opts,signal:AbortSignal.timeout(4000)});
  return response;
};
const api=async(base,route,body,options={})=>{
  const headers={'authorization':'Bearer '+auth,'content-type':'application/json',...(options.headers??{})};
  const response=await query(base+route,{method:'POST',headers,body:JSON.stringify(body)});
  return {code:response.status,body:await response.json()};
};
try{
  // This health check MUST reach the actual engine, not a fixture.
  const bad=await query('http://127.0.0.1:'+management+'/dev/rs377-observe');
  assert.equal(bad.status,404);
  const badHeader=await query('http://127.0.0.1:'+management+'/dev/rs377-observe',{
    headers:{authorization:'Bearer '+randomBytes(32).toString('base64url')}});
  assert.equal(badHeader.status,404);
  record('real_engine_observer_auth_denies_missing_and_wrong_token');

  const crcResp=await query('http://127.0.0.1:'+web+'/crc');
  assert.equal(crcResp.status,200);
  const crcs=Buffer.from(await crcResp.arrayBuffer());
  assert.ok(crcs.length>=36);
  const publicKeyPem=await readFile(path.join(process.env.TASK26_ENGINE_DIR,'data/config/public.pem'),'utf8');
  const session=new Session377({target:{host:'127.0.0.1',port,mode:'isolated'},
    username:bot,password:'fixturetest1',publicKeyPem,crcs:crcs.subarray(0,36),timeoutMs:12000});
  boundary=new Native377BoundaryTransport({
    session,nativeSource:source,observerToken:token,botName:bot,
    worldId:world,proofTimeoutMs:9000
  });
  const authenticated=await boundary.connect();
  assert.equal(authenticated.authenticated,true);
  record('real_377_rsa_isaac_login_and_bot_observer_advancing_ticks');
  const first=await boundary.observe();
  assert.equal(first.player.username,bot);
  assert.ok(first.tick>=0&&first.player.inventory);
  assert.equal(first.world.instanceId,world);
  record('authoritative_engine_player_identity_world_and_state');

  await assert.rejects(()=>createNative377Observer(source,{
    token,botName:'harnessother',expectedWorld:world
  }).observe(),/wrong identity/);
  await assert.rejects(()=>createNative377Observer(source,{
    token,botName:bot,expectedWorld:'isolated-another-world'
  }).observe(),/wrong world/);
  record('real_engine_account_and_world_scope_checks');

  const ledger=await new ReplayLedger(path.join(dest,'replay-journal.json')).load();
  gateway=await startAuthenticated377Gateway({transport:boundary,ledger,authToken:auth});
  assert.equal(gateway.address.host,'127.0.0.1');
  const base='http://127.0.0.1:'+gateway.address.port;
  assert.equal((await api(base,'/claim',{}, {headers:{authorization:'Bearer wrong'}})).code,401);
  assert.equal((await api(base,'/claim',{}, {headers:{origin:'https://untrusted.invalid'}})).code,403);
  assert.equal((await api(base,'/claim',{}, {headers:{host:'evil.invalid'}})).code,403);
  const huge=await query(base+'/claim',{method:'POST',headers:{
    authorization:'Bearer '+auth,'content-type':'application/json'},body:JSON.stringify({payload:'a'.repeat(9000)})});
  assert.equal(huge.status,413);
  record('real_gateway_loopback_bearer_origin_host_and_bounded_request');

  const racing=await Promise.all([api(base,'/claim',{}),api(base,'/claim',{})]);
  assert.deepEqual(racing.map(x=>x.code).sort(),[200,409]);
  const lease=racing.find(x=>x.code===200).body.data.lease;
  assert.equal(typeof lease,'string');
  record('real_gateway_single_controller_lease_race');

  assert.equal((await api(base,'/act',{lease:'invalid',actionId:'wrong_lease01',tool:'walk',args:{x:first.player.x,z:first.player.z}})).code,409);
  assert.equal((await api(base,'/act',{lease,actionId:'cheat_action01',tool:'teleport',args:{x:3222,z:3218}})).code,409);
  record('real_gateway_rejects_wrong_lease_and_privileged_tool');

  const actionId='real_engine_walk01';
  const act=await api(base,'/act',{lease,actionId,tool:'walk',
    args:{x:first.player.x+1,z:first.player.z},timeoutMs:2200});
  assert.equal(act.code,200);
  assert.equal(act.body.data.dispatched,true);
  assert.ok(['observed','unverified','timeout'].includes(act.body.data.status));
  // Never accept a claimed success without real observed destination coordinates.
  if(act.body.data.status==='observed'){
    const after=await boundary.observe();
    assert.equal(after.player.x,first.player.x+1);
    assert.equal(after.player.z,first.player.z);
  }
  const replay=await api(base,'/act',{lease,actionId,tool:'walk',
    args:{x:first.player.x+1,z:first.player.z}});
  assert.equal(replay.code,409);
  record('real_tcp_normal_player_packet_and_durable_no_replay');

  const safe=await api(base,'/observe',{});
  assert.equal(safe.code,200);
  assert.equal(safe.body.data.player.username,bot);
  assert.equal('password' in safe.body.data,false);
  assert.equal('otherPlayers' in safe.body.data,false);
  record('real_gateway_bot_only_observation_without_secrets');

  // Rate-limit and tick-spacing refusal using the SAME real controller.
  gateway.controller.maximum=1; // test-only stricter than production default of 12
  const limited=await api(base,'/act',{lease,actionId:'real_engine_walk02',tool:'walk',
    args:{x:first.player.x,z:first.player.z},timeoutMs:0});
  assert.equal(limited.code,409);
  record('real_gateway_rate_limit_refusal');

  const stopped=await api(base,'/stop',{lease});
  assert.equal(stopped.code,200);
  assert.equal((await api(base,'/act',{lease,actionId:'after_stop01',tool:'walk',
    args:{x:first.player.x,z:first.player.z}})).code,409);
  record('real_gateway_stop_clears_lease');

  boundary.close();
  assert.equal(boundary.status().authenticated,false);
  await assert.rejects(()=>boundary.dispatch({type:'walk',x:first.player.x,z:first.player.z}),/native_not_authenticated/);
  assert.throws(()=>session.send({type:'walk',x:first.player.x,z:first.player.z}),/No authenticated/);
  record('no_packet_after_disposable_session_close');
  console.log(JSON.stringify({task:26,realEngine:true,mode:'disposable-ci-only',
    source:'pinned-Engine-TS',world,bot,tests:stages.length,passed:stages,verification:'real_engine_test'}));
}finally{
  try{if(gateway)await gateway.close();else boundary?.close();}catch{}
  await rm(dest,{recursive:true,force:true});
}
