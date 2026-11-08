import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseEnvFile,requireIsolatedConfig,inspectNativeWindowsRuntime} from '../native377.mjs';

const token='a'.repeat(64);
function config({
 profile='joshrs_ci_377',port=15402,webPort=18880,
 bots='HarnessA,HarnessB',observer='true',isolated='true'
}={}){
 return {gamePort:port,webPort,env:{
  NODE_PROFILE:profile,NODE_XPRATE:'1',
  RS377_OBSERVER_ENABLED:observer,RS377_OBSERVER_ISOLATED:isolated,
  RS377_OBSERVER_WORLD:'isolated-joshrs-ci-377',
  RS377_OBSERVER_SOURCE_SHA:'b'.repeat(40),
  RS377_OBSERVER_TOKEN:token,
  RS377_OBSERVER_BOTS:bots,
  WEB_MANAGEMENT_PORT:'18881'
 }};
}
test('isolated 377 config allows each distinct disposable account without exposing secrets',()=>{
 const cfg=requireIsolatedConfig(config(),{name:'HarnessA'});
 assert.equal(cfg.port,15402);
 assert.equal(cfg.world,'isolated-joshrs-ci-377');
 assert.equal(cfg.token,token);
 assert.ok(!JSON.stringify({port:cfg.port,world:cfg.world}).includes(token));
 assert.equal(requireIsolatedConfig(config(),{name:'HarnessB'}).port,15402);
});
test('never allow live family port, main profile, weak token or arbitrary identities',()=>{
 assert.throws(()=>requireIsolatedConfig(config({profile:'main'}),{name:'HarnessA'}),/not_isolated/);
 assert.throws(()=>requireIsolatedConfig(config({port:52402}),{name:'HarnessA'}),/isolated_ports/);
 assert.throws(()=>requireIsolatedConfig(config(),{name:'Sylvie'}),/not_allowlisted/);
 assert.throws(()=>requireIsolatedConfig(config({bots:'HarnessA,HarnessA'}),{name:'HarnessA'}),/not_allowlisted/);
 assert.throws(()=>requireIsolatedConfig(config({observer:'false'}),{name:'HarnessA'}),/not_isolated/);
 assert.throws(()=>requireIsolatedConfig(config({isolated:'false'}),{name:'HarnessA'}),/not_isolated/);
 const weak=config();weak.env.RS377_OBSERVER_TOKEN='weak';
 assert.throws(()=>requireIsolatedConfig(weak,{name:'HarnessA'}),/invalid/);
});
test('refuse duplicate environment keys; trim BOM from active JSON and keep engine within private runtime',async()=>{
 assert.throws(()=>parseEnvFile('NODE_PORT=15402\nNODE_PORT=43594'),/duplicate/);
 const root=await mkdtemp(join(tmpdir(),'joshrs-agent-manager-test-'));
 try{
  const runtime=join(root,'runtime','jparris-377');
  const engine=join(runtime,'fixture','engine');
  await mkdir(engine,{recursive:true});
  await writeFile(join(engine,'.env'),'NODE_PROFILE=joshrs_ci_377\nNODE_XPRATE=1\nWEB_PORT=18880\n');
  await writeFile(join(runtime,'active.json'),'\uFEFF'+JSON.stringify({engine,gamePort:15402,webPort:18880}));
  const config=await inspectNativeWindowsRuntime(root);
  assert.equal(config.gamePort,15402);
  assert.equal(config.webPort,18880);
  assert.equal(config.env.NODE_PROFILE,'joshrs_ci_377');
  const outside=join(root,'outside');
  await mkdir(outside);
  await writeFile(join(outside,'.env'),'NODE_PORT=9999');
  await writeFile(join(runtime,'active.json'),JSON.stringify({engine:outside,gamePort:15402,webPort:18880}));
  await assert.rejects(()=>inspectNativeWindowsRuntime(root),/outside_private_runtime/);
 }finally{await rm(root,{recursive:true,force:true})}
});
