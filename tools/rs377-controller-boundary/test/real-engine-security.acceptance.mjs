/**
 * Task 26 acceptance against an ACTUALLY BOOTED pinned revision-377 engine.
 * Called only from probe-real-isolated377.mjs in the disposable CI runner.
 * It ADOPTS its existing normal Session377 login; no simulated game server,
 * synthetic observations, extra account, privileged action or save mutation.
 */
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createNative377Observer} from '../../rs377-chatgpt-bridge/src/native-observer.mjs';
import {
  Native377BoundaryTransport,createLoopbackEngine377Source,startAuthenticated377Gateway
} from '../lib/native377-transport.mjs';
import {ReplayLedger} from '../lib/recovery.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function verifyRealEngineGateway({session,managementPort,token,botName,worldId}={}){
  if(process.env.RS377_LIVE_BOT_PROBE!=='true'||
     process.env.NODE_PROFILE!=='joshrs_ci_377'||
     process.env.RS377_OBSERVER_ISOLATED!=='true'||
     process.env.NODE_XPRATE!=='1'||
     process.env.WEBSITE_REGISTRATION!=='false'||
     session?.target?.host!=='127.0.0.1'||session?.target?.port!==15402||
     session?.target?.mode!=='isolated'||!session.status().authenticated||
     managementPort!==18881||botName!=='HarnessProbe'||
     worldId!=='isolated-joshrs-ci-377')
     throw new Error('task26_not_a_verified_disposable_engine_session');
  const checks=[],mark=x=>checks.push(x);
  const source=createLoopbackEngine377Source({port:managementPort,token});
  const obsUri='http://127.0.0.1:'+managementPort+'/dev/rs377-observe';
  const unauthorized=await fetch(obsUri,{redirect:'error',signal:AbortSignal.timeout(3000)});
  assert.equal(unauthorized.status,404);
  const incorrect=await fetch(obsUri,{headers:{
    authorization:'Bearer '+randomBytes(32).toString('base64url')},signal:AbortSignal.timeout(3000)});
  assert.equal(incorrect.status,404);
  mark('actual_engine_observer_bearer_refusal');

  const badBot=createNative377Observer(source,{botName:'HarnessOther',
    expectedWorld:worldId,token});
  await assert.rejects(()=>badBot.observe(),/wrong identity/);
  const badWorld=createNative377Observer(source,{botName,
    expectedWorld:'isolated-unrelated-test',token});
  await assert.rejects(()=>badWorld.observe(),/wrong world/);
  mark('actual_engine_bot_and_world_identity');

  const native=new Native377BoundaryTransport({
    session,nativeSource:source,observerToken:token,botName,worldId,proofTimeoutMs:9000
  });
  const accepted=await native.connect({adoptAuthenticated:true});
  assert.equal(accepted.authenticated,true);
  const state=await native.observe();
  assert.equal(state.player.username,botName);
  assert.equal(state.world.revision,377);
  assert.equal(state.world.xpMultiplier,1);
  mark('actual_377_login_adopted_with_fresh_authenticated_game_ticks');

  const privateDir=await mkdtemp(path.join(os.tmpdir(),'joshrs-task26-real-'));
  const bearer=randomBytes(40).toString('base64url');
  let gateway;
  try{
    const ledger=await new ReplayLedger(path.join(privateDir,'journal.json')).load();
    gateway=await startAuthenticated377Gateway({transport:native,ledger,authToken:bearer});
    assert.equal(gateway.address.host,'127.0.0.1');
    const base='http://127.0.0.1:'+gateway.address.port;
    const api=async(route,body,extraHeaders={})=>{
      const response=await fetch(base+route,{
        method:'POST',headers:{'content-type':'application/json',
          authorization:'Bearer '+bearer,...extraHeaders},
        body:JSON.stringify(body),signal:AbortSignal.timeout(6000)
      });
      return {code:response.status,body:await response.json()};
    };
    assert.equal((await api('/claim',{}, {authorization:'Bearer wrong'})).code,401);
    assert.equal((await api('/claim',{}, {origin:'https://untrusted.invalid'})).code,403);
    // Undici/fetch may normalise or replace the Host header. Exercise the
    // real HTTP host guard using a raw Node HTTP client that sends a forged Host.
    const forgedHostCode=await new Promise((resolve,reject)=>{
      const request=httpRequest({
        hostname:'127.0.0.1',port:gateway.address.port,path:'/claim',method:'POST',
        timeout:3000,
        headers:{host:'attacker.invalid',authorization:'Bearer '+bearer,
          'content-type':'application/json','content-length':'2'}
      },response=>{
        response.resume();
        response.on('end',()=>resolve(response.statusCode));
      });
      request.on('timeout',()=>request.destroy(new Error('forged_host_timeout')));
      request.on('error',reject);
      request.end('{}');
    });
    assert.equal(forgedHostCode,403);
    assert.equal((await api('/claim',{malicious:'a'.repeat(8192)})).code,413);
    mark('gateway_loopback_auth_origin_host_and_bounded_json');

    const concurrent=await Promise.all([api('/claim',{}),api('/claim',{})]);
    assert.deepEqual(concurrent.map(x=>x.code).sort(),[200,409]);
    const lease=concurrent.find(x=>x.code===200).body.data.lease;
    assert.ok(lease.length>=32);
    assert.equal((await api('/act',{lease:'bad',actionId:'bad_lease_0001',
      tool:'walk',args:{x:state.player.x,z:state.player.z}})).code,409);
    assert.equal((await api('/act',{lease,actionId:'teleport_0001',
      tool:'teleport',args:{x:3222,z:3218}})).code,409);
    mark('single_lease_concurrent_claim_and_allowlisted_tools');

    const x=state.player.x,z=state.player.z;
    const destination=x<16383?x+1:x-1;
    const act=await api('/act',{lease,actionId:'engine_walk_0001',
      tool:'walk',args:{x:destination,z},timeoutMs:1700});
    assert.equal(act.code,200);
    assert.equal(act.body.data.dispatched,true);
    assert.ok(['observed','unverified','timeout'].includes(act.body.data.status));
    if(act.body.data.status==='observed'){
      const verified=await native.observe();
      assert.equal(verified.player.x,destination);
      assert.equal(verified.player.z,z);
      assert.notEqual(verified.player.x,x);
    }
    mark('actual_isaac_tcp_normal_walk_dispatch_without_fabricated_effect');

    // Test the real, durable ledger after enough time for a 600ms world tick.
    await sleep(750);
    const replay=await api('/act',{lease,actionId:'engine_walk_0001',
      tool:'walk',args:{x:destination,z},timeoutMs:0});
    assert.equal(replay.code,409);
    assert.equal(ledger.get('engine_walk_0001')?.type,'walk');
    mark('durable_same_action_id_no_replay');

    gateway.controller.maximum=1; // ONLY stricter during this disposable test
    assert.equal((await api('/act',{lease,actionId:'engine_walk_0002',
      tool:'walk',args:{x:destination,z},timeoutMs:0})).code,409);
    gateway.controller.maximum=12;
    mark('real_gateway_rate_limit');

    const visibility=await api('/observe',{});
    assert.equal(visibility.code,200);
    assert.equal(visibility.body.data.player.username,botName);
    assert.equal('otherPlayers' in visibility.body.data,false);
    assert.equal('credentials' in visibility.body.data,false);
    mark('only_selected_bot_state_visible');

    await sleep(750);
    const waiting=api('/act',{lease,actionId:'cancel_wait_0001',
      tool:'wait',args:{ticks:20},timeoutMs:4000});
    await sleep(180);
    const stopped=await api('/stop',{lease});
    assert.equal(stopped.code,200);
    const done=await waiting;
    assert.equal(done.code,200);
    assert.equal(done.body.data.status,'cancelled');
    assert.equal((await api('/act',{lease,actionId:'after_stop_0001',
      tool:'walk',args:{x:destination,z}})).code,409);
    mark('inflight_cancellation_stop_and_post_stop_lease_refusal');

    const after=await native.observe();
    assert.ok(after.tick>state.tick);
    return {checks,loginAuthenticated:true,realEngine:true,
      initialPosition:{x,z},finalPosition:{x:after.player.x,z:after.player.z},
      action:act.body.data.status,packetDispatched:true,
      sourceSha:accepted.sourceSha,transport:native};
  }finally{
    // Only close the HTTP listener. The original, real TCP session must
    // remain open for the separate SDK action/save/relogin acceptance test.
    try{if(gateway)await gateway.gateway.close();}finally{
      await rm(privateDir,{recursive:true,force:true});
    }
  }
}
