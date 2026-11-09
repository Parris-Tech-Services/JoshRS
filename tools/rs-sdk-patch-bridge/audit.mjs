#!/usr/bin/env node
/**
 * Read-only compatibility audit from JoshRS patch sources to a LOCAL RS-SDK checkout.
 * It intentionally does not install, compile, stop, restart or change either world.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const DEFAULT_SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONTENT_ROOTS = ['content-patches'];
const EXTRA_PATCH_ROOTS = ['tools/rs-sdk-quests/patches'];
const SAFE_CONTENT = /^(?:scripts|pack|maps)\/[\w./+\-]+$/;
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const safeFile = (p) => {
  if (p.includes('\0') || p.startsWith('/') || p.split('/').some(s=>!s||s==='.'||s==='..'||s==='\\')) return false;
  return /^[\w./+\-]+$/.test(p);
};
function ensureInside(root, rel) {
  if (!safeFile(rel)) throw Error('Unsafe relative path: '+rel);
  let curr=root;
  for (const component of rel.split('/')) {
    curr=path.join(curr,component);
    if (fs.existsSync(curr) && fs.lstatSync(curr).isSymbolicLink()) throw Error('Symlink encountered: '+rel);
  }
  return curr;
}
function tree(root, ext=null) {
  if (!fs.existsSync(root)) return [];
  if (fs.lstatSync(root).isSymbolicLink()) throw Error('Symlinked source root: '+root);
  const result=[], work=[root];
  while(work.length) {
    const dir=work.pop();
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      if(entry.isSymbolicLink()) throw Error('Symlinked source entry: '+entry.name);
      const next=path.join(dir,entry.name);
      if(entry.isDirectory())work.push(next);
      else if(entry.isFile() && (!ext||next.endsWith(ext)))result.push(next);
    }
  }
  return result.sort();
}
function toDestination(p) {
  const stripped=p.startsWith('server/content/')?p.slice('server/content/'.length):p;
  return SAFE_CONTENT.test(stripped) && safeFile(stripped)?stripped:null;
}
function parsePatch(text) {
  if (text.includes('\0')||/^(GIT binary patch|Binary files |rename from |rename to )/m.test(text)) return {error:'binary-or-rename'};
  const names=[], lines=text.split(/\r?\n/);
  for(let i=0;i<lines.length;i++) {
    if(!lines[i].startsWith('--- '))continue;
    const before=lines[i].slice(4).split('\t')[0];
    const plus=lines[i+1]||'';
    if(!plus.startsWith('+++ '))return {error:'invalid-patch-header'};
    const after=plus.slice(4).split('\t')[0];
    if(before==='/dev/null' || after==='/dev/null')return {error:'create-or-delete-requires-port'};
    if(!before.startsWith('a/')||!after.startsWith('b/'))return {error:'unexpected-patch-prefix'};
    const a=before.slice(2),b=after.slice(2);
    if(!safeFile(a)||!safeFile(b)||a!==b)return {error:'unsafe-or-renamed-path'};
    names.push(a);
  }
  if(!names.length)return {error:'no-file-hunks'};
  return {paths:[...new Set(names)].sort()};
}
function gitApplyCheck(folder, patchPath, reverse=false) {
  const args=['apply', '--check', ...(reverse?['--reverse']:[]),'--',patchPath];
  const proc=spawnSync('git',args,{cwd:folder,encoding:'utf8',timeout:12000,maxBuffer:1024*1024});
  return proc.status===0 && !proc.error;
}
function simpleGit(args,cwd) {
  const p=spawnSync('git',args,{cwd,encoding:'utf8',timeout:5000});
  return p.status===0?p.stdout.trim():null;
}
function optionalRevision(sdk) {
  const worldJson=path.join(sdk,'server/engine/data/config/world.json');
  if (fs.existsSync(worldJson) && !fs.lstatSync(worldJson).isSymbolicLink()) {
    try {const cfg=JSON.parse(fs.readFileSync(worldJson,'utf8'));return cfg.engine?.revision??'unknown';}
    catch {return 'unreadable-config';}
  }
  return 'unknown-from-file; inspect runtime config';
}
export function audit({source=DEFAULT_SOURCE,sdk}) {
  if(!sdk || !path.isAbsolute(sdk))throw Error('--sdk requires an absolute directory');
  source=fs.realpathSync(source);sdk=fs.realpathSync(sdk);
  if(source===sdk)throw Error('JoshRS source and RS-SDK checkout must be different directories');
  const content=path.join(sdk,'server/content');
  const engine=path.join(sdk,'server/engine');
  if(!fs.statSync(path.join(sdk,'sdk')).isDirectory() ||
      !fs.statSync(content).isDirectory() ||
      !fs.statSync(engine).isDirectory())throw Error('Not an RS-SDK checkout with sdk/, server/engine and server/content');
  if(!fs.existsSync(path.join(source,'content-patches','rs377','patches')))throw Error('Not a JoshRS source checkout with 377 patch bundle');
  if(fs.lstatSync(content).isSymbolicLink())throw Error('Refusing symlinked RS-SDK content root');
  const patches=[...CONTENT_ROOTS,...EXTRA_PATCH_ROOTS]
    .flatMap(p=>tree(path.join(source,p),'.patch'));
  const records=[];
  for(const file of patches) {
    const rel=path.relative(source,file).split(path.sep).join('/');
    const parsed=parsePatch(fs.readFileSync(file,'utf8'));
    let status='requires-manual-port',reason=parsed.error||'';
    if(parsed.paths) {
      const destinations=parsed.paths.map(toDestination);
      if(destinations.every(Boolean) && parsed.paths.every((p,i)=>p===destinations[i])) {
        // git apply --check never writes. Syntactic matching does NOT prove semantic compatibility.
        for(const p of destinations)ensureInside(content,p);
        if(gitApplyCheck(content,file,true)){status='already-applied-hunks';reason='reverse patch matches; verify semantics manually';}
        else if(gitApplyCheck(content,file,false)){status='hunks-appear-applicable';reason='manual version review + disposable compile/playtest still required';}
        else {status='requires-manual-port';reason='patch hunks do not match SDK content or dependencies';}
      } else if(destinations.every(Boolean))reason='patch has server/content/ prefix; manual path adaptation required';
      else reason='not exclusively a content scripts/pack/maps patch';
    }
    records.push({patch:rel,sha256:hash(fs.readFileSync(file)),paths:parsed.paths||[],status,reason});
  }
  const bundleRoot=path.join(source,'content-patches/rs377/scripts');
  const bundle=tree(bundleRoot).map(file=>{
    const rel=path.relative(source,file).split(path.sep).join('/');
    const targetRel=path.relative(path.join(source,'content-patches/rs377'),file).split(path.sep).join('/');
    const target=ensureInside(content,targetRel);
    const state=!fs.existsSync(target)?'missing':
      fs.statSync(target).isFile() && hash(fs.readFileSync(target))===hash(fs.readFileSync(file))?'identical':'different';
    return {path:rel,target:targetRel,status:state};
  });
  const counts=Object.fromEntries([...new Set(records.map(r=>r.status))].map(k=>[k,records.filter(r=>r.status===k).length]));
  const bundleCounts=Object.fromEntries(['missing','identical','different'].map(k=>[k,bundle.filter(x=>x.status===k).length]));
  return {schema:'joshrs-sdk-compatibility-audit-v1',readOnly:true,automaticallySafeToApply:0,
    sourceCommit:simpleGit(['rev-parse','HEAD'],source),sdkCommit:simpleGit(['rev-parse','HEAD'],sdk),
    sdkRevision:optionalRevision(sdk),counts,bundleCounts,patches:records,scriptBundle:bundle,
    warnings:[
      'No game, SDK, database or save files were written or restarted.',
      'Matching patch hunks do not establish compatibility between 377 and older RS-SDK.',
      'Do not apply JoshRS 377 updater directly to server/content or merge game databases.',
      'Build adapted patches in a separate RS-SDK clone, test quests and login/relogin, then use controlled downtime with backups.'
    ]};
}
export function parseArgs(argv) {
  let sdk=null,source=DEFAULT_SOURCE,format='summary';
  for(let i=0;i<argv.length;i++) {
    if(argv[i]==='--sdk')sdk=argv[++i];
    else if(argv[i]==='--source')source=argv[++i];
    else if(argv[i]==='--json')format='json';
    else if(argv[i]==='--help')return {help:true};
    else throw Error('Unknown argument: '+argv[i]);
  }
  if(!sdk||!path.isAbsolute(sdk))throw Error('Supply --sdk /absolute/path/to/rs-sdk');
  return {sdk,source,format};
}
function main() {
  try {
    const a=parseArgs(process.argv.slice(2));
    if(a.help){console.log('node tools/rs-sdk-patch-bridge/audit.mjs --sdk /absolute/path/to/rs-sdk [--json]');return;}
    const report=audit(a);
    if(a.format==='json'){console.log(JSON.stringify(report,null,2));return;}
    console.log('RS-SDK COMPATIBILITY - READ ONLY\nJoshRS '+report.sourceCommit+'\nRS-SDK '+report.sdkCommit+' (revision '+report.sdkRevision+')');
    console.log('Patch count '+report.patches.length+'; categories '+JSON.stringify(report.counts));
    console.log('377 source-bundle files '+report.scriptBundle.length+'; categories '+JSON.stringify(report.bundleCounts));
    for(const p of report.patches)console.log(p.status.padEnd(26)+' '+p.patch+': '+p.reason);
    console.log('NO PATCHES APPLIED. No account or player save touched.');
  } catch(e) {console.error('BLOCKED: '+e.message);process.exitCode=1;}
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
