#!/usr/bin/env node
/**
 * JoshRS unified revision-377 source updater.
 *
 * Read-only by default. Only operates on an explicitly selected, stopped,
 * private engine/content pair. No account edits, resets, migrations or auto-starts.
 * Run from the official JoshRS source checkout; never from a Google Doc.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PATCH_REL = 'content-patches/rs377/patches';
const BUNDLE_REL = 'content-patches/rs377';
const PATCH_RE = /^\d{4}-[a-z0-9-]+\.patch$/;
const SAFE_REL = /^(?:scripts|pack|maps)\/[A-Za-z0-9_.\/+-]+$/;
const SCHEMA = 'joshrs-377-unified-updater-v1';
const QUESTS = [
  'quest_fenkenstrain','quest_rag','quest_soulbane','quest_swansong',
  'quest_myreque','quest_ics','quest_mdaughter','quest_hauntedmine',
  'quest_losttribe','quest_makinghistory','quest_handsand','quest_feud',
  'quest_elid','quest_osf','quest_dwarfrock','quest_tog','quest_zogre',
  'quest_giantdwarf','quest_forget','quest_garden','quest_twocats',
  'quest_wanted','quest_deal','quest_agrith'
];
const EXTRA = [
  'scripts/areas/area_ahoy/scripts/ahoy_ghost_dialogue_377.rs2',
  'scripts/quests/quest_mortton/configs/quest_mortton.varp',
  'scripts/quests/quest_mortton/configs/joshrs_mortton_finish.constant',
  'scripts/quests/quest_mortton/scripts/joshrs_mortton_start.rs2',
  'scripts/quests/quest_mortton/scripts/joshrs_mortton_finish.rs2',
  'scripts/areas/area_lumbridge/scripts/joshrs_cook_millie_377.rs2',
  'scripts/areas/area_lumbridge/scripts/joshrs_cook_gillie_377.rs2'
];

function fail(message) { throw new Error('BLOCKED: ' + message); }
function digest(input) { return crypto.createHash('sha256').update(input).digest('hex'); }
function exists(p) { return fs.existsSync(p); }
function real(p) { return fs.realpathSync(p); }
function within(parent, child) {
  const rel = path.relative(parent, child);
  return rel !== '' && rel !== '..' && !rel.startsWith('..'+path.sep) && !path.isAbsolute(rel);
}
function cleanRel(rel) {
  if (!SAFE_REL.test(rel) || rel.includes('..') || rel.includes('//') || rel.startsWith('/')) fail('Unsafe patch/source path: '+rel);
  return rel;
}
function ensureNoSymlinks(root, rel) {
  let cursor = root;
  for (const part of rel.split('/')) {
    cursor = path.join(cursor,part);
    if (exists(cursor) && fs.lstatSync(cursor).isSymbolicLink()) fail('Refusing symlink in source path: '+rel);
  }
}
function listTree(root) {
  const out = [];
  const stack=[root];
  while(stack.length) {
    const dir=stack.pop();
    for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
      const f=path.join(dir,item.name);
      if(item.isSymbolicLink()) fail('Symbolic link inside managed bundle: '+f);
      if(item.isDirectory()) stack.push(f);
      else if(item.isFile()) out.push(f);
      else fail('Unsupported file type in bundle: '+f);
    }
  }
  return out.sort();
}
function gitApply(root,patch,...args) {
  return spawnSync('git',['apply',...args,patch],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
}
function parsePatchPaths(text) {
  if(text.includes('GIT binary patch') || text.includes('\0')) fail('Binary patch is not supported');
  const paths=[];
  for(const line of text.split(/\r?\n/)) {
    if(!line.startsWith('diff --git ')) continue;
    const m=/^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
    if(!m || m[1]!==m[2]) fail('Renames/binary/quoted patch paths require manual review');
    paths.push(cleanRel(m[1]));
  }
  if(!paths.length || new Set(paths).size!==paths.length) fail('No valid, unique patch paths');
  return paths;
}
function fileHash(file) { return digest(fs.readFileSync(file)); }
function getPatches(repo=REPO, minCount=33) {
  const folder=path.join(repo,PATCH_REL);
  const files=fs.readdirSync(folder).filter(p=>PATCH_RE.test(p)).sort();
  if(files.length<minCount || files.some((f,i)=>Number(f.slice(0,4))!==i+1)) {
    fail('Expected contiguous numbered 377 patches beginning at 0001 (at least '+minCount+')');
  }
  return files.map(name=>{
    const filename=path.join(folder,name);
    if(fs.lstatSync(filename).isSymbolicLink()) fail('Symlink patch not allowed');
    const body=fs.readFileSync(filename,'utf8');
    return {name,path:filename,sha256:digest(body),paths:parsePatchPaths(body)};
  });
}
function detectWorld({repo=REPO, explicit}={}) {
  let root, engine, content, origin;
  if(explicit) {
    root=real(path.resolve(explicit));
    engine=real(path.join(root,'engine'));
    content=real(path.join(root,'content'));
    origin='explicit';
  } else if(process.platform==='win32') {
    const runtime=path.join(repo,'runtime','jparris-377');
    const active=path.join(runtime,'active.json');
    if(!exists(active)) fail('Windows active.json not found. Set up JoshRS first or provide --world.');
    const cfg=JSON.parse(fs.readFileSync(active,'utf8'));
    engine=real(cfg.engine);content=real(cfg.content);
    root=real(path.dirname(engine));
    const privateRuntime=real(runtime);
    if(!within(privateRuntime,engine)||!within(privateRuntime,content)||
       path.basename(engine)!=='engine'||path.basename(content)!=='content'||
       path.dirname(engine)!==path.dirname(content)) fail('Windows active game is outside the private JoshRS runtime');
    origin='windows-active';
  } else {
    const home=os.homedir();
    const paths=[
      path.join(home,'dev/JoshRS/lostcity377'),
      path.join(home,'lostcity377'),
      path.join(home,'dev/JoshRS-source/lostcity377'),
      path.join(home,'dev/JoshRS')
    ];
    const candidates=[...new Set(paths.filter(p=>exists(path.join(p,'engine/package.json'))&&
      exists(path.join(p,'content/pack/obj.pack'))).map(real))];
    if(candidates.length!==1) fail('Fedora world selection ambiguous or missing ('+candidates.length+
      ' candidates). Supply --world /absolute/path/to/lostcity377.');
    root=candidates[0];engine=real(path.join(root,'engine'));content=real(path.join(root,'content'));
    origin='fedora-known-location';
  }
  if(path.dirname(engine)!==root||path.dirname(content)!==root ||
     path.basename(engine)!=='engine'||path.basename(content)!=='content') {
    fail('World must contain sibling engine/ and content/ directories, not arbitrary paths');
  }
  for(const rel of ['package.json','src/app.ts','src/engine/World.ts']) {
    if(!fs.statSync(path.join(engine,rel)).isFile()) fail('Incomplete revision-377 engine: '+rel);
  }
  for(const rel of ['pack/obj.pack','scripts/quests/quest_romeojuliet/scripts/quest_romeojuliet.rs2']) {
    if(!fs.statSync(path.join(content,rel)).isFile()) fail('Incomplete revision-377 content: '+rel);
  }
  if(!exists(path.join(engine,'data/pack'))) fail('Compiled engine pack missing. Install the game first');
  return {root,engine,content,origin};
}
function stateLocation(world) {
  const bucket=digest(world.root).slice(0,24);
  const base=process.platform==='win32'
    ? path.join(os.homedir(),'AppData','Local','JoshRS','unified-377-updater')
    : path.join(os.homedir(),'.local','state','joshrs-unified-377-updater');
  return path.join(base,bucket);
}
function previousState(world,statePath,patches) {
  const f=path.join(statePath,'installed.json');
  if(!exists(f)) return {skip:0};
  const state=JSON.parse(fs.readFileSync(f,'utf8'));
  if(state.schema!==SCHEMA||state.world!==world.root||!Array.isArray(state.patches)||
     !state.files||typeof state.files!=='object') fail('Installed state manifest is invalid or belongs to another world');
  if(state.patches.length>patches.length) fail('Patch history is newer than this JoshRS checkout');
  for(let i=0;i<state.patches.length;i++) {
    if(state.patches[i].name!==patches[i].name||state.patches[i].sha256!==patches[i].sha256) {
      fail('Installed patch history differs from current checkout; do not downgrade or overwrite');
    }
  }
  for(const [rel,sha] of Object.entries(state.files)) {
    cleanRel(rel);ensureNoSymlinks(world.content,rel);
    const fpath=path.join(world.content,rel);
    if(!exists(fpath)||fileHash(fpath)!==sha) fail('Managed source changed since prior update: '+rel);
  }
  return {skip:state.patches.length};
}
function listBundleFiles(repo=REPO) {
  const root=path.join(repo,BUNDLE_REL);
  const out=[];
  for(const quest of QUESTS) {
    const dir=path.join(root,'scripts/quests',quest);
    if(!exists(dir)) fail('Missing reviewed quest bundle: '+quest);
    for(const file of listTree(dir)) {
      const rel=path.relative(root,file).replaceAll(path.sep,'/');
      out.push({rel:cleanRel(rel),data:fs.readFileSync(file)});
    }
  }
  for(const rel of EXTRA) {
    const src=path.join(root,rel);
    if(!exists(src)||fs.lstatSync(src).isSymbolicLink()) fail('Missing/unsafe additional script: '+rel);
    out.push({rel:cleanRel(rel),data:fs.readFileSync(src)});
  }
  if(out.length<40||new Set(out.map(x=>x.rel)).size!==out.length) fail('Unexpected empty/duplicate quest overlay');
  return out;
}
function scanHandler(content,npc) {
  const target='[opnpc1,'+npc+']';
  let matches=[];
  for(const file of listTree(path.join(content,'scripts'))) {
    if(!file.endsWith('.rs2'))continue;
    const body=fs.readFileSync(file,'utf8');
    if(body.includes(target))matches.push(file);
  }
  if(matches.length>1) fail('Duplicate Talk-to handlers for '+npc);
  return matches.length===1?matches[0]:null;
}
function planUpdate(world,{repo=REPO,minCount=33,statePathOverride}={}) {
  const patches=getPatches(repo,minCount);
  const statePath=statePathOverride||stateLocation(world);
  const prior=previousState(world,statePath,patches);
  const remaining=patches.slice(prior.skip);
  const targets=new Set(remaining.flatMap(p=>p.paths));
  const stage=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-377-plan-'));
  const changed=new Map();
  const results=[];
  try {
    for(const rel of targets) {
      ensureNoSymlinks(world.content,rel);
      const from=path.join(world.content,rel),to=path.join(stage,rel);
      if(exists(from)) {
        if(!fs.statSync(from).isFile())fail('Patch target not a regular file: '+rel);
        fs.mkdirSync(path.dirname(to),{recursive:true});
        fs.copyFileSync(from,to);
      }
    }
    for(const patch of remaining) {
      const forward=gitApply(stage,patch.path,'--check');
      if(forward.status===0) {
        const applied=gitApply(stage,patch.path);
        if(applied.status!==0) fail('Patch application failed in disposable preflight: '+patch.name);
        results.push({name:patch.name,status:'pending'});
      } else if(gitApply(stage,patch.path,'--reverse','--check').status===0) {
        results.push({name:patch.name,status:'already-present'});
      } else {
        fail('Patch conflicts with existing source: '+patch.name+'. No installed files changed');
      }
    }
    for(const rel of targets) {
      const from=path.join(stage,rel),dest=path.join(world.content,rel);
      if(!exists(from)) fail('Patch removed a managed file, requiring manual review: '+rel);
      const data=fs.readFileSync(from);
      if(!exists(dest)||!fs.readFileSync(dest).equals(data))changed.set(rel,data);
    }
    const bundleFiles=listBundleFiles(repo);
    const knownHandlers={
      'scripts/areas/area_lumbridge/scripts/joshrs_cook_millie_377.rs2':'millie_the_miller',
      'scripts/areas/area_lumbridge/scripts/joshrs_cook_gillie_377.rs2':'gillie_the_milkmaid'
    };
    for(const file of bundleFiles) {
      const dest=path.join(world.content,file.rel);
      ensureNoSymlinks(world.content,file.rel);
      const npc=knownHandlers[file.rel];
      if(npc&&(!exists(dest))&&scanHandler(world.content,npc)) {
        results.push({name:file.rel,status:'preserved-existing-dialogue'});
        continue;
      }
      if(changed.has(file.rel)) {
        if(!changed.get(file.rel).equals(file.data))fail('Patch and bundle collide: '+file.rel);
        continue;
      }
      if(exists(dest)) {
        if(!fs.statSync(dest).isFile()||!fs.readFileSync(dest).equals(file.data)) {
          fail('Existing customised quest file conflicts; preserving it: '+file.rel);
        }
      } else changed.set(file.rel,file.data);
    }
    // Track every patch-managed target even if no new bytes are needed.
    const allManaged=new Set([...Object.keys(prior.files||{}),...targets,...bundleFiles.map(f=>f.rel)]);
    return {patches,changed,results,allManaged,statePath,priorCount:prior.skip,world,repo};
  } finally { fs.rmSync(stage,{recursive:true,force:true}); }
}
function immutableCopy(from,to) {
  if(fs.lstatSync(from).isSymbolicLink()) fail('Refusing a symlink in backup source: '+from);
  if(fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to,{recursive:true,mode:0o700});
    for(const name of fs.readdirSync(from))immutableCopy(path.join(from,name),path.join(to,name));
  } else if(fs.statSync(from).isFile()) {
    fs.mkdirSync(path.dirname(to),{recursive:true,mode:0o700});
    fs.copyFileSync(from,to);
    if(fileHash(from)!==fileHash(to))fail('SHA256 backup mismatch: '+from);
  } else fail('Unsupported backup file type: '+from);
}
function hashDirectory(root) {
  if(!exists(root))return null;
  const out={};
  for(const file of listTree(root))out[path.relative(root,file).replaceAll(path.sep,'/')]=fileHash(file);
  return out;
}
function saveSources(world) {
  return ['data/players','db.sqlite','db.sqlite-wal','db.sqlite-shm']
    .map(rel=>({rel,src:path.join(world.engine,rel)})).filter(x=>exists(x.src));
}
function readPort(env,key) {
  const m=new RegExp('^'+key+'=(\\d+)$','m').exec(env);
  return m?Number(m[1]):null;
}
async function isPortOpen(port) {
  return await new Promise(resolve=>{
    const socket=net.connect({host:'127.0.0.1',port});
    const finish=x=>{socket.destroy();resolve(x);};
    socket.setTimeout(450);
    socket.once('connect',()=>finish(true));
    socket.once('error',()=>finish(false));
    socket.once('timeout',()=>finish(false));
  });
}
async function assertStopped(world) {
  const envfile=path.join(world.engine,'.env');
  if(!exists(envfile))fail('No engine .env; unable to verify selected game ports');
  const env=fs.readFileSync(envfile,'utf8');
  const ports=['NODE_PORT','WEB_PORT','WEB_MANAGEMENT_PORT']
    .map(k=>readPort(env,k)).filter(v=>v!==null);
  if(ports.length<2||ports.some(v=>v<1024||v>65535))fail('Unknown or unsafe game ports in .env');
  for(const port of new Set(ports))if(await isPortOpen(port))fail('Local server listener still active on port '+port);
}
function writeAtomic(file,data) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const tmp=file+'.joshrs-new-'+process.pid;
  try {
    fs.writeFileSync(tmp,data,{flag:'wx'});
    fs.renameSync(tmp,file);
  } finally {if(exists(tmp))fs.rmSync(tmp,{force:true});}
}
function applyAndBuild(plan,{build=true,runBuild}={}) {
  const {world,changed,patches,statePath,allManaged}=plan;
  fs.mkdirSync(statePath,{recursive:true,mode:0o700});
  const backup=path.join(statePath,'backups','update-'+new Date().toISOString().replace(/[^0-9]/g,'')+'-'+process.pid);
  fs.mkdirSync(backup,{recursive:true,mode:0o700});
  const backups=new Map();
  const saves=saveSources(world),savedBefore=new Map();
  const allSources=[
    ...saves.map(x=>({src:x.src,rel:'saves/'+x.rel})),
    {src:path.join(world.engine,'data/pack'),rel:'packs/engine-pack'},
    {src:path.join(world.content,'pack'),rel:'packs/content-pack'}
  ];
  const priorManifest=path.join(statePath,'installed.json');
  if(exists(priorManifest))allSources.push({src:priorManifest,rel:'manifest/installed.json'});
  for(const rel of changed.keys()) {
    ensureNoSymlinks(world.content,rel);
    const src=path.join(world.content,rel);
    if(exists(src))allSources.push({src,rel:'source/'+rel});
    backups.set(rel,exists(src));
  }
  let modified=false;
  try {
    for(const entry of allSources) {
      if(!exists(entry.src))continue;
      immutableCopy(entry.src,path.join(backup,entry.rel));
      if(entry.rel.startsWith('saves/'))savedBefore.set(entry.rel,
        fs.statSync(entry.src).isDirectory()?hashDirectory(entry.src):fileHash(entry.src));
    }
    // All backups, including offline accounts, were SHA256-verified first.
    for(const [rel,data] of changed) {
      writeAtomic(path.join(world.content,rel),data);
      modified=true;
    }
    if(build && changed.size) {
      const runner=runBuild||(()=>{
        const cmd=process.platform==='win32'?'npm.cmd':'npm';
        const env={...process.env,BUILD_SRC_DIR:world.content,BUILD_VERIFY:'true',BUILD_VERIFY_PACK:'true'};
        return spawnSync(cmd,['run','build'],{
          cwd:world.engine,env,encoding:'utf8',timeout:900000,
          maxBuffer:20*1024*1024,shell:process.platform==='win32'
        });
      });
      const result=runner();
      fs.writeFileSync(path.join(backup,'build.log'),String(result.stdout||'')+'\n'+String(result.stderr||''),{mode:0o600});
      if(result.status!==0 || result.error) fail('Native 377 build failed; original scripts and packs will be restored');
      for(const rel of ['data/pack/server/script.dat','data/pack/server/script.idx']) {
        const f=path.join(world.engine,rel);
        if(!exists(f)||fs.statSync(f).size<1)fail('Compiled script pack missing: '+rel);
      }
    }
    // The build must not silently rewrite quest source behind the planner.
    for(const [rel,data] of changed) {
      const target=path.join(world.content,rel);
      if(!exists(target)||!fs.readFileSync(target).equals(data))fail('Build mutated managed quest source: '+rel);
    }
    for(const item of saves) {
      const key='saves/'+item.rel,prior=savedBefore.get(key);
      const now=fs.statSync(item.src).isDirectory()?hashDirectory(item.src):fileHash(item.src);
      if(JSON.stringify(prior)!==JSON.stringify(now))fail('Player/account save changed during update: '+item.rel);
    }
    const hashes={};
    for(const rel of allManaged) {
      ensureNoSymlinks(world.content,rel);
      const src=path.join(world.content,rel);
      if(exists(src)) hashes[rel]=fileHash(src);
    }
    const installed={schema:SCHEMA,world:world.root,
      patches:patches.map(x=>({name:x.name,sha256:x.sha256})),
      files:hashes,verifiedSourceBuild:build&&changed.size>0,
      lastInstallTime:new Date().toISOString(),
      liveGameplayVerified:false};
    writeAtomic(priorManifest,JSON.stringify(installed,null,2)+'\n');
    return {backup,changed:changed.size,compiled:build&&changed.size>0,verifiedGameplay:false};
  } catch(err) {
    if(modified) {
      for(const [rel,wasPresent] of backups) {
        const dst=path.join(world.content,rel),src=path.join(backup,'source',rel);
        if(wasPresent) {
          if(exists(src))writeAtomic(dst,fs.readFileSync(src));
        } else if(exists(dst))fs.rmSync(dst,{force:true});
      }
      for(const [dst,rel] of [
        [path.join(world.engine,'data/pack'),'packs/engine-pack'],
        [path.join(world.content,'pack'),'packs/content-pack']
      ]) {
        const copy=path.join(backup,rel);
        if(exists(copy)) {
          if(exists(dst))fs.rmSync(dst,{recursive:true,force:true});
          immutableCopy(copy,dst);
        }
      }
      if(exists(path.join(backup,'manifest/installed.json')))
        writeAtomic(priorManifest,fs.readFileSync(path.join(backup,'manifest/installed.json')));
      else if(exists(priorManifest))fs.rmSync(priorManifest,{force:true});
    }
    throw err;
  }
}

function parseArgs(argv) {
  let mode='check',world;
  for(let i=0;i<argv.length;i++) {
    const arg=argv[i];
    if(arg==='--check')mode='check';
    else if(arg==='--apply')mode='apply';
    else if(arg==='--world')world=argv[++i];
    else if(arg==='--help')return {help:true};
    else if(arg!=='--confirm-stopped')fail('Unknown argument '+arg);
  }
  if(argv.includes('--world')&&!world)fail('--world requires an absolute world directory');
  if(world&&!path.isAbsolute(world))fail('--world must be an absolute path');
  return {mode,world,confirmed:argv.includes('--confirm-stopped')};
}
async function main(argv) {
  const args=parseArgs(argv);
  if(args.help) {
    console.log('Usage: node tools/rs377-unified-updater/updater.mjs [--check|--apply] [--world /absolute/world] [--confirm-stopped]');
    return;
  }
  const world=detectWorld({explicit:args.world});
  const plan=planUpdate(world);
  const summary={world:world.root,selection:world.origin,patches:plan.patches.length,
    previouslyRecordedPatches:plan.priorCount,sourceChanges:plan.changed.size,
    patchStatus:plan.results,gameplayVerified:false};
  console.log(JSON.stringify(summary,null,2));
  if(args.mode==='check') {console.log('READ_ONLY_PREFLIGHT_PASSED: no game files changed');return;}
  if(!args.confirmed)fail('Explicit --confirm-stopped required; log out all players and stop the actual server first');
  await assertStopped(world);
  if(!plan.changed.size) {
    console.log('SOURCE_ALREADY_CURRENT: no rebuild or save modification needed; live quest playthrough still unverified');
    return;
  }
  const result=applyAndBuild(plan);
  console.log('SOURCE_AND_NATIVE_BUILD_VERIFIED '+JSON.stringify(result));
  console.log('LIVE_QUEST_PLAYTHROUGH_AND_RELOGIN_NOT_VERIFIED');
}
if(process.argv[1] && real(process.argv[1])===real(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).catch(err=>{console.error(err.message);process.exitCode=1;});
}
export {SCHEMA,parsePatchPaths,getPatches,detectWorld,planUpdate,applyAndBuild,parseArgs,saveSources,hashDirectory};
