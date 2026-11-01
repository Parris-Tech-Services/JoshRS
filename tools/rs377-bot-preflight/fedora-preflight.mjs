#!/usr/bin/env node
/**
 * ChatGPT task 13/42: read-only JoshRS Fedora bot preflight.
 * No network requests, shell evaluation, installation, service changes or
 * game login. Never reads .env, private keys, account DBs, saves or work files.
 */
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, readFileSync, realpathSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT=path.resolve(HERE,'../..');
export const GAME_PORTS=Object.freeze([52402,8888,8898,45099,43500,43501,53402,8988]);
const SOURCE_ALLOWLIST=Object.freeze([
  'AGENTS.md',
  'README.md',
  'deploy/jparris-windows/upstreams.json',
  'docs/rs377/CHATGPT_OWNED_AGY_PREPARATION_TODO_2026-11-02.md',
  'tools/rs377-bot-preflight/fedora-preflight.mjs'
]);
const GAME_SOURCE_ALLOWLIST=Object.freeze([
  'engine/src/app.ts',
  'client-java/gradle/wrapper/gradle-wrapper.properties'
]);

function runReadOnly(command,args){
  // No shell, stdin or network probe. Capture Java's version (printed to stderr).
  const result=spawnSync(command,args,{encoding:'utf8',timeout:2500,maxBuffer:65536,stdio:['ignore','pipe','pipe'],
    env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
  return {ok:result.status===0&&!result.error,
    stdout:typeof result.stdout==='string'?result.stdout:'',
    stderr:typeof result.stderr==='string'?result.stderr:'',
    code:result.error?.code??result.status??null};
}
function textResult(res){
  return res?.ok?String(res.stdout??'').trim():'';
}
function versionFrom(text){
  const v=String(text).match(/\b\d+(?:\.\d+){1,3}(?:[+-]\d+)?\b/);
  return v?v[0]:'unknown';
}
function isRegularFile(file){
  try {const st=lstatSync(file);return st.isFile()&&!st.isSymbolicLink()&&st.size<=2*1024*1024;}catch{return false;}
}
function fileHash(root,relative){
  // Only fixed, checked-in SOURCE paths are ever hashed. No directory recursion.
  if(relative.split('/').some(x=>x==='..'||x==='data'||x==='runtime'||x==='.env'))return null;
  const filename=path.join(root,relative);
  if(!isRegularFile(filename))return null;
  try{
    const realRoot=realpathSync(root),actual=realpathSync(filename);
    if(!actual.startsWith(realRoot+path.sep))return null;
    return createHash('sha256').update(readFileSync(filename)).digest('hex');
  }catch{return null;}
}
function gitInfo(root,run){
  if(!existsSync(root))return {present:false};
  const inside=run('git',['-C',root,'rev-parse','--show-toplevel']);
  if(!inside?.ok)return {present:false};
  const branch=textResult(run('git',['-C',root,'symbolic-ref','--short','-q','HEAD']))||'detached';
  const commit=textResult(run('git',['-C',root,'rev-parse','--verify','HEAD']));
  const state=run('git',['-C',root,'status','--porcelain','--untracked-files=no']);
  return {present:true,branch:branch.slice(0,96),
    commit:/^[a-f0-9]{40,64}$/i.test(commit)?commit:'unknown',
    trackedChanges:state?.ok?(String(state.stdout).length>0?'present':'none'):'unknown'};
}
export function parseListeners(raw,ports=GAME_PORTS){
  const rows=[];
  for(const line of String(raw??'').split(/\r?\n/)){
    const columns=line.trim().split(/\s+/);
    if(columns.length<5||columns[0]!=='LISTEN')continue;
    const addr=columns[3];
    const m=addr.match(/:(\d{2,5})$/);
    if(!m)continue;
    const port=Number(m[1]);
    if(!ports.includes(port))continue;
    const owners=[...line.matchAll(/"([^"]{1,80})",pid=(\d+)/g)].map(x=>({
      name:x[1].replace(/[^A-Za-z0-9_.-]/g,'_'),pid:Number(x[2])
    }));
    const host=addr.slice(0,addr.length-m[0].length);
    const scope=['127.0.0.1','[::1]','::1'].includes(host)?'loopback':'non-loopback/unspecified';
    rows.push({port,scope,owners});
  }
  return ports.map(port=>{
    const found=rows.filter(x=>x.port===port);
    return {port,listener:found.length>0,bindings:found.map(x=>({
      scope:x.scope,owners:x.owners.length?x.owners:null
    }))};
  });
}
export function parseRouting(raw,interfaces=[]){
  // Only interface names and counts are surfaced; never routes, gateways or IPs.
  const lines=String(raw??'').split(/\r?\n/).filter(Boolean);
  const names=[...new Set([...lines.flatMap(l=>[...l.matchAll(/\bdev\s+([a-zA-Z0-9_.:-]+)/g)].map(m=>m[1])),
    ...interfaces])].filter(x=>/^[a-zA-Z0-9_.:-]{1,32}$/.test(x));
  const def=lines.find(l=>/^default(?:\s|$)/.test(l));
  const defaultDevice=def?.match(/\bdev\s+([a-zA-Z0-9_.:-]+)/)?.[1]??null;
  return {defaultDevice,routeCount:lines.length,
    hasTailscaleInterface:names.some(x=>x==='tailscale0'||x.startsWith('tailscale')),
    interfaces:names.sort()};
}
function detectedPaths(root,home){
  const candidates=[
    {label:'JoshRS repository',location:root},
    {label:'Historical Fedora game',location:path.join(home,'dev/JoshRS/lostcity377')},
    {label:'Alternate historical game',location:path.join(home,'lostcity377')},
    {label:'Agy harness worktree',location:path.join(home,'dev/JoshRS-rssdk-harness')},
    {label:'RS-SDK research checkout',location:path.join(home,'dev/JoshRS-rssdk-harness/research-checkouts/rs-sdk')}
  ];
  return candidates.map(c=>({...c,exists:existsSync(c.location)}));
}
function gradleWrapperVersion(game){
  const file=path.join(game,'client-java/gradle/wrapper/gradle-wrapper.properties');
  if(!isRegularFile(file))return null;
  try{
    const raw=readFileSync(file,'utf8');
    return raw.match(/gradle-(\d+(?:\.\d+){1,3})-(?:bin|all)\.zip/)?.[1]??null;
  }catch{return null;}
}
export function collectPreflight({
  root=DEFAULT_ROOT,home=os.homedir(),run=runReadOnly,
  interfaces=Object.keys(os.networkInterfaces()),platform=process.platform
}={}){
  const repo=path.resolve(root),base=path.resolve(home);
  const paths=detectedPaths(repo,base);
  const gameCandidates=[path.join(base,'dev/JoshRS/lostcity377'),path.join(base,'lostcity377')];
  const game=gameCandidates.find(c=>existsSync(path.join(c,'engine'))&&existsSync(path.join(c,'client-java')))||null;
  let osRelease='';
  try{osRelease=readFileSync('/etc/os-release','utf8').slice(0,16384);}catch{ /* non-Linux fixture */ }
  const name=osRelease.match(/^PRETTY_NAME=(?:"([^"]+)"|([^\n]+))$/m);
  const versionOf=(cmd,args)=>{
    const r=run(cmd,args);
    return versionFrom((r?.ok?(r.stdout||'')+'\n'+(r.stderr||''):''));
  };
  const gitRoots=[repo,path.join(base,'dev/JoshRS-rssdk-harness')];
  const git=gitRoots.map(location=>({location,...gitInfo(location,run)}));
  const listen=run('ss',['-H','-ltnp']);
  const route=run('ip',['-4','route','show']);
  const routes=route.ok?parseRouting(route.stdout,interfaces):parseRouting('',interfaces);
  const hashes=[
    ...SOURCE_ALLOWLIST.map(relative=>({scope:'repo',relative,sha256:fileHash(repo,relative)})),
    ...(game?GAME_SOURCE_ALLOWLIST.map(relative=>({scope:'game-source',relative,sha256:fileHash(game,relative)})):[])
  ];
  return {
    tool:'JoshRS Fedora read-only bot preflight',platform,
    operatingSystem:name?.[1]??name?.[2]??'unknown',
    versions:{
      node:process.version,
      npm:versionOf('npm',['--version']),
      git:versionOf('git',['--version']),
      java:versionOf('java',['-version']),
      gradleWrapper:game?gradleWrapperVersion(game):null,
      agyOnPath:Boolean(textResult(run('which',['agy']))),
    },
    paths,git,gameSource:game,
    listeners:{inspection:listen.ok?'observed (unprivileged owner details may be hidden)':'unavailable',
      entries:listen.ok?parseListeners(listen.stdout):GAME_PORTS.map(port=>({port,listener:null,bindings:[]}))},
    routing:{inspection:route.ok?'local kernel route table':'unavailable',...routes},
    hashes,
    guarantees:'Read-only local diagnostics only; no login, network probes, startup, saves or credentials accessed.'
  };
}
export function renderPreflight(r){
  const lines=[
    'JoshRS Fedora — read-only bot preflight (task 13/42)',
    'OS: '+r.operatingSystem+' | platform: '+r.platform,
    'Tools: Node '+r.versions.node+'; npm '+r.versions.npm+'; Git '+r.versions.git+
      '; Java '+r.versions.java+'; Gradle wrapper '+(r.versions.gradleWrapper??'not found')+
      '; Agy '+(r.versions.agyOnPath?'on PATH':'not detected'),
    'Known locations (existence only):'
  ];
  for(const p of r.paths)lines.push('  '+(p.exists?'PRESENT':'MISSING')+'  '+p.label+': '+p.location);
  lines.push('Git metadata (no remote URLs or changed filenames):');
  for(const g of r.git)lines.push('  '+g.location+': '+(g.present?
    'branch='+g.branch+' commit='+g.commit+' tracked_changes='+g.trackedChanges:'not a readable Git checkout'));
  lines.push('TCP listener ownership ['+r.listeners.inspection+']:');
  for(const item of r.listeners.entries){
    if(item.listener===null){lines.push('  '+item.port+': UNKNOWN (ss unavailable)');continue;}
    if(!item.listener){lines.push('  '+item.port+': no LISTEN seen');continue;}
    lines.push('  '+item.port+': '+item.bindings.map(b=>b.scope+' '+(b.owners?
      b.owners.map(o=>o.name+'(pid '+o.pid+')').join(', '):'owner hidden/unknown')).join('; '));
  }
  lines.push('Local routing ['+r.routing.inspection+']: default interface='+(r.routing.defaultDevice??'unknown')+
    '; visible routes='+r.routing.routeCount+'; tailscale interface detected='+r.routing.hasTailscaleInterface);
  lines.push('  Interface names only: '+(r.routing.interfaces.join(', ')||'none'));
  lines.push('Allowlisted SOURCE SHA-256 (no keys, passwords, databases, saves or cache):');
  for(const x of r.hashes)lines.push('  '+x.scope+'/'+x.relative+': '+(x.sha256??'not found/skipped'));
  lines.push('READ-ONLY. No server readiness, world identity or live bot functionality claimed.');
  return lines.join('\n')+'\n';
}
function cli(argv){
  let root=DEFAULT_ROOT,home=os.homedir();
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--root'&&argv[i+1])root=argv[++i];
    else if(argv[i]==='--home'&&argv[i+1])home=argv[++i];
    else if(argv[i]==='--help'){
      process.stdout.write('Usage: node tools/rs377-bot-preflight/fedora-preflight.mjs [--root DIR] [--home DIR]\n'+
        'Read-only: versions, known paths, Git branch/SHA, listener PIDs, routing interfaces and allowlisted source hashes.\n');
      return;
    }else throw new Error('Unknown or incomplete option: '+argv[i]);
  }
  process.stdout.write(renderPreflight(collectPreflight({root,home})));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{cli(process.argv.slice(2));}catch(e){process.stderr.write('Preflight error: '+e.message+'\n');process.exitCode=2;}
}
