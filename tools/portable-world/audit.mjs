#!/usr/bin/env node
/**
 * Read-only inventory of the REAL installed revision-377 JoshRS source.
 * No game changes, no uploads, no backups of active DBs.
 */
import { createHash } from 'node:crypto';
import { existsSync, createReadStream } from 'node:fs';
import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_EXT = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.rs2','.java','.kt','.kts','.gradle','.json','.yaml','.yml','.toml','.xml','.properties','.cfg','.npc','.loc','.obj','.inv','.param','.seq','.spotanim','.if','.area','.flo','.idk','.md','.sh','.cmd','.bat','.ps1','.css','.html','.sql','.py','.txt','.packsrc']);
const REVIEW_EXT = new Set(['.png','.jpg','.jpeg','.gif','.webp','.bmp','.svg','.ogg','.mp3','.wav','.mid','.midi','.dat','.bin','.jag','.jgz','.jar','.zip']);
const SKIP_DIRS = new Set(['.git','node_modules','.gradle','.idea','.vscode','.cache','cache','build','dist','coverage','logs','log','save-backups','backups','snapshots','temp','tmp','out','target','players','secrets','credentials','private','keystore','certificates','gradle-cache']);
const PRIVATE_PATTERN = /(^|[._-])(private|secrets?|passwords?|credentials?|tokens?|apikeys?|api_keys?|keypairs?|ssh|auth(?:entication)?|sessions?|accounts?|wallets?|personal)([._-]|$)/i;
const MAX_HASH_BYTES = 32 * 1024 * 1024;

function parseArgs(argv) {
  const args = {};
  for (let i=0;i<argv.length;i++) {
    const key = argv[i];
    if (!['--root','--active-file','--output','--baseline-engine','--baseline-content','--baseline-client'].includes(key) || !argv[i+1]) throw new Error('Unknown or missing argument: ' + key);
    args[key.slice(2)] = argv[++i];
  }
  return args;
}
function isExcluded(name) {
  const base = name.toLowerCase();
  return base.startsWith('.') || base === 'db.sqlite' || base.endsWith('.sav') || base.endsWith('.pem') || base.endsWith('.key') || base.endsWith('.p12') || base.endsWith('.pfx') || PRIVATE_PATTERN.test(base);
}
function classify(name) {
  if (isExcluded(name)) return null;
  const ext=path.extname(name).toLowerCase();
  if (SOURCE_EXT.has(ext)) return 'source';
  if (REVIEW_EXT.has(ext)) return 'asset-review-only';
  return null;
}
async function sha256(filename) {
  const hash=createHash('sha256');
  for await (const buf of createReadStream(filename)) hash.update(buf);
  return hash.digest('hex');
}
async function inventory(directory) {
  const files=[];
  const counters={excludedDirectories:0,excludedSensitiveNames:0,unrecognisedExtensions:0,tooLargeToHash:0,unreadable:0};
  if (!directory || !existsSync(directory)) return {available:false,files,counters};
  const pending=[{abs:directory,rel:''}];
  while(pending.length) {
    const current=pending.pop();
    let entries;
    try { entries=await readdir(current.abs,{withFileTypes:true}); }
    catch { counters.unreadable++; continue; }
    for(const e of entries) {
      const rel=current.rel ? current.rel + '/' + e.name : e.name;
      if(e.isSymbolicLink()) {counters.excludedDirectories++;continue;}
      if(e.isDirectory()) {
        if(SKIP_DIRS.has(e.name.toLowerCase()) || isExcluded(e.name)) {counters.excludedDirectories++;continue;}
        pending.push({abs:path.join(current.abs,e.name),rel});
        continue;
      }
      if(!e.isFile()) continue;
      if(isExcluded(e.name)) {counters.excludedSensitiveNames++;continue;}
      const category=classify(e.name);
      if(!category) {counters.unrecognisedExtensions++;continue;}
      try {
        const filename=path.join(current.abs,e.name);
        const st=await stat(filename);
        const record={path:rel.split(path.sep).join('/'),category,bytes:st.size};
        if(st.size<=MAX_HASH_BYTES) record.sha256=await sha256(filename);
        else {record.sha256=null;counters.tooLargeToHash++;}
        files.push(record);
      } catch {counters.unreadable++;}
    }
  }
  files.sort((a,b)=>a.path.localeCompare(b.path));
  return {available:true,files,counters};
}
function compare(local,baseline) {
  if(!local.available) return {status:'missing-local-source',counts:null,changes:[]};
  if(!baseline.available) return {status:'baseline-not-available',counts:null,changes:[]};
  const old=new Map(baseline.files.map(f=>[f.path.toLowerCase(),f]));
  const now=new Map(local.files.map(f=>[f.path.toLowerCase(),f]));
  const changes=[];
  for(const [key,f] of now) {
    const prev=old.get(key);
    if(!prev) changes.push({path:f.path,type:'added',category:f.category});
    else if(!f.sha256 || !prev.sha256) changes.push({path:f.path,type:'hash-not-available',category:f.category});
    else if(f.sha256!==prev.sha256) changes.push({path:f.path,type:'modified',category:f.category});
  }
  for(const [key,f] of old) if(!now.has(key)) changes.push({path:f.path,type:'missing-vs-baseline',category:f.category});
  changes.sort((a,b)=>a.path.localeCompare(b.path));
  const counts={added:0,modified:0,'hash-not-available':0,'missing-vs-baseline':0};
  for(const change of changes) counts[change.type]++;
  return {status:'compared-to-local-baseline-not-proven-pinned',counts,changes};
}
async function run() {
  const opts=parseArgs(process.argv.slice(2));
  const root=path.resolve(opts.root||DEFAULT_ROOT);
  const activeFile=path.resolve(opts['active-file']||path.join(root,'runtime','jparris-377','active.json'));
  const output=path.resolve(opts.output||path.join(os.homedir(),'Documents','JoshRS-Exports',new Date().toISOString().replace(/[:.]/g,'-')));
  if(!existsSync(activeFile)) throw new Error('No active.json found. Run this inside your INSTALLED JParrisDesktop launcher; no files changed.');
  // Windows PowerShell 5.1 may write UTF-8 JSON with a BOM (U+FEFF). Strip only that marker.
  const active=JSON.parse((await readFile(activeFile,'utf8')).replace(/^\uFEFF/,''));
  if(!active.engine || !active.content || !active.client) throw new Error('Incomplete active.json; no files changed.');
  const game={engine:active.engine,content:active.content,client:active.client};
  const baselineRoot=path.join(root,'runtime','jparris-377','upstream');
  const baselines={
    engine:opts['baseline-engine']||path.join(baselineRoot,'engine'),
    content:opts['baseline-content']||path.join(baselineRoot,'content'),
    client:opts['baseline-client']||path.join(baselineRoot,'client-java')
  };
  // No absolute path or source contents ever serialised; paths are relative to game source.
  const report={schema:1,kind:'JoshRS 377 read-only local source inventory',createdUtc:new Date().toISOString(),
    scope:'allow-listed-source-and-asset-filenames-hashes-only-no-secrets-no-saves-no-auto-upload',
    worlds:{},notes:[]};
  for(const name of ['engine','content','client']) {
    console.log('Inspecting ' + name + ' source (read-only)...');
    const local=await inventory(game[name]);
    const baseline=await inventory(baselines[name]);
    const delta=compare(local,baseline);
    report.worlds[name]={present:local.available,fileCount:local.files.length,counters:local.counters,
      baselinePresent:baseline.available,baselineFileCount:baseline.files.length,comparison:delta,files:local.files};
    if(!baseline.available) report.notes.push(name + ': clean local baseline not found; customisations cannot yet be distinguished.');
    if(!local.available) report.notes.push(name + ': configured source path inaccessible.');
  }
  report.privateWorld={
    playerDirectoryPresent:existsSync(path.join(game.engine,'data','players')),
    accountDatabasePresent:existsSync(path.join(game.engine,'db.sqlite')),
    backupsIncluded:false,
    requiresOfflineConsistentEncryptedBackup:true
  };
  report.notes.push('A source difference does not establish GitHub sync, source-licensing rights, or a working restore.');
  report.notes.push('This inventory does not protect saves: offline encrypted backup and isolated restore are still required.');
  await mkdir(output,{recursive:true});
  await writeFile(path.join(output,'inventory.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  const summary=[
    'JoshRS 377 local world inventory - READ ONLY',
    'Generated UTC: ' + report.createdUtc,
    'NO saves, accounts, passwords, env content, cache content or source content copied.',
    'NO GitHub upload or modifications to your running world.',
    ...Object.entries(report.worlds).map(([name,w])=>name + ': ' + (w.present?'found':'MISSING') + '; files=' + w.fileCount + '; baseline=' + (w.baselinePresent?'found (unverified)':'MISSING') + '; changed paths=' + w.comparison.changes.length),
    'Player directory present: ' + (report.privateWorld.playerDirectoryPresent?'yes':'no'),
    'Account DB present: ' + (report.privateWorld.accountDatabasePresent?'yes':'no'),
    '', ...report.notes, '',
    'NEXT: share inventory.json for comparison. DO NOT share DBs, .sav, .env or complete game folders.'
  ].join('\r\n');
  await writeFile(path.join(output,'SUMMARY.txt'),summary+'\r\n',{flag:'wx',mode:0o600});
  console.log('\n' + summary + '\n');
  console.log('Report folder: ' + output);
}
try { await run(); }
catch(e) { console.error('JOSHRS_AUDIT_NOT_COMPLETED: ' + e.message); process.exitCode=1; }
