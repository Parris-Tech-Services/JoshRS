import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {collectPreflight,renderPreflight,parseListeners,parseRouting,GAME_PORTS} from './fedora-preflight.mjs';

function testRoot(){
  const home=mkdtempSync(path.join(tmpdir(),'rs377-fedora-'));
  const root=path.join(home,'dev/JoshRS');
  const game=path.join(root,'lostcity377');
  for(const [file,data] of [
    [path.join(root,'AGENTS.md'),'Example source'],
    [path.join(root,'README.md'),'Example readme'],
    [path.join(game,'engine/src/app.ts'),'Example engine source'],
    [path.join(game,'client-java/gradle/wrapper/gradle-wrapper.properties'),'distributionUrl=https://example.com/gradle-9.2.0-bin.zip']
  ]){
    mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,data);
  }
  return {home,root,game,cleanup:()=>rmSync(home,{recursive:true,force:true})};
}
function mockRun(command,args){
  if(command==='ss')return {ok:true,stdout:[
    'LISTEN 0 128 127.0.0.1:52402 0.0.0.0:* users:(("node",pid=321,fd=5))',
    'LISTEN 0 128 0.0.0.0:8888 0.0.0.0:*',
    'LISTEN 0 128 [::1]:45099 [::]:* users:(("java",pid=456,fd=5))'
  ].join('\n')};
  if(command==='ip')return {ok:true,stdout:'default via 192.168.23.1 dev enp1s0\n100.64.0.0/10 dev tailscale0'};
  if(command==='git'){
    if(args.includes('--show-toplevel'))return {ok:true,stdout:'/tmp/repo'};
    if(args.includes('symbolic-ref'))return {ok:true,stdout:'feature/rs377-test'};
    if(args.includes('status'))return {ok:true,stdout:' M src/app.ts'};
    return {ok:true,stdout:'a'.repeat(40)};
  }
  if(command==='java')return {ok:true,stdout:'',stderr:'openjdk version "25.0.4.1"'};
  if(command==='npm')return {ok:true,stdout:'11.5.2'};
  if(command==='which')return {ok:true,stdout:'/usr/local/bin/agy'};
  return {ok:true,stdout:'git version 2.51.0'};
}
test('parses listening port ownership and marks hidden owners without disclosing bind IPs',()=>{
  const parsed=parseListeners(
    'LISTEN 0 128 127.0.0.1:52402 0.0.0.0:* users:(("node",pid=987,fd=11))\n'+
    'LISTEN 0 128 [::1]:45099 [::]:* users:(("java",pid=21,fd=4))\n'+
    'LISTEN 0 128 0.0.0.0:8888 0.0.0.0:*');
  assert.equal(parsed.length,GAME_PORTS.length);
  assert.deepEqual(parsed.find(x=>x.port===52402).bindings[0].owners,[{name:'node',pid:987}]);
  assert.equal(parsed.find(x=>x.port===45099).bindings[0].scope,'loopback');
  assert.equal(parsed.find(x=>x.port===8888).bindings[0].owners,null);
  assert.equal(parsed.find(x=>x.port===43500).listener,false);
});
test('routing parser only exposes interface names and route counts',()=>{
  const report=parseRouting('default via 192.168.50.1 dev enp1s0\n100.64.0.0/10 dev tailscale0',['lo']);
  assert.equal(report.defaultDevice,'enp1s0');
  assert.equal(report.routeCount,2);
  assert.equal(report.hasTailscaleInterface,true);
  assert.doesNotMatch(JSON.stringify(report),/192\.168\.50\.1|100\.64/);
});
test('safe source hashes, Git branch, Java version and process owner all appear',()=>{
  const f=testRoot();
  try{
    const report=collectPreflight({root:f.root,home:f.home,run:mockRun,interfaces:['lo','tailscale0']});
    const text=renderPreflight(report);
    assert.match(text,/Java 25\.0\.4\.1/);
    assert.match(text,/Gradle wrapper 9\.2\.0/);
    assert.match(text,/branch=feature\/rs377-test/);
    assert.match(text,/node\(pid 321\)/);
    assert.match(text,/owner hidden\/unknown/);
    assert.match(text,/default interface=enp1s0/);
    assert.match(text,/[a-f0-9]{64}/);
    assert.equal(report.hashes.find(x=>x.relative==='engine/src/app.ts').sha256.length,64);
    assert.equal(text.includes('192.168.23.1'),false);
    assert.match(text,/No server readiness, world identity or live bot functionality claimed/);
  }finally{f.cleanup();}
});
test('missing privileges and absent tools are unknown, not incorrectly declared healthy',()=>{
  const f=testRoot();
  try{
    const report=collectPreflight({root:f.root,home:f.home,run:()=>({ok:false,stdout:'',stderr:'unavailable'}),interfaces:[]});
    const text=renderPreflight(report);
    assert.match(text,/52402: UNKNOWN/);
    assert.match(text,/default interface=unknown/);
    assert.match(text,/Java unknown/);
    assert.match(text,/not a readable Git checkout/);
  }finally{f.cleanup();}
});
test('CLI runs read-only on an alternate fixture root',()=>{
  const f=testRoot();
  try{
    const file=fileURLToPath(new URL('./fedora-preflight.mjs',import.meta.url));
    const result=spawnSync(process.execPath,[file,'--root',f.root,'--home',f.home],
      {encoding:'utf8',timeout:9000});
    assert.equal(result.status,0,result.stderr);
    assert.match(result.stdout,/JoshRS Fedora — read-only bot preflight/);
    assert.match(result.stdout,/READ-ONLY/);
  }finally{f.cleanup();}
});
