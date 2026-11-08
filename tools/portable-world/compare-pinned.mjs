#!/usr/bin/env node
/**
 * Snapshot only pristine, SHA-pinned upstream SOURCE into the user's Documents.
 * Then compare hashes against the live selected source without changing it.
 * Never copies saved accounts, databases, live packs, or entire active worlds.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const docs = path.join(os.homedir(), 'Documents', 'JoshRS-Exports');
const expected = {
  engine: {url:'https://github.com/LostCityRS/Engine-TS.git',branch:'377-wip'},
  content: {url:'https://github.com/LostCityRS/Content.git',branch:'377-wip'},
  client: {url:'https://github.com/LostCityRS/Client-Java.git',branch:'377'}
};
function readUtf8Json(p) {
  return readFile(p,'utf8').then(s => JSON.parse(s.trimStart()));
}
function git(args, capture=false) {
  const result=spawnSync('git',args,{encoding:'utf8',stdio:capture?['ignore','pipe','pipe']:'inherit',windowsHide:false});
  if(result.error) throw new Error('Git failed: '+result.error.message+' (check Git is installed).');
  if(result.status!==0) throw new Error('Git returned '+result.status+' during a read-only upstream baseline setup. No installed JoshRS game files changed.');
  return capture?(result.stdout||'').trim():'';
}
function verifiedSpec(name,spec) {
  if (!spec || spec.url!==expected[name].url || spec.branch!==expected[name].branch ||
      typeof spec.commit!=='string' || !/^[a-f0-9]{40}$/.test(spec.commit)) {
    throw new Error('Unexpected upstream '+name+' URL/branch/SHA in upstreams.json. Refusing automatic checkout.');
  }
}
function checkRepoAtPin(folder,sha) {
  if(!existsSync(path.join(folder,'.git'))) throw new Error('Existing baseline directory is not a Git repository: '+folder);
  const head=git(['-C',folder,'rev-parse','HEAD'],true);
  if(head!==sha) throw new Error('Existing baseline checkout has an unexpected revision: '+folder+' (no changes made)');
  if(git(['-C',folder,'status','--porcelain'],true)) throw new Error('Existing upstream checkout contains local changes: '+folder+' (no changes made)');
}
function ensurePin(name,spec) {
  const folder=path.join(docs,'baseline-pinned',name+'-'+spec.commit.slice(0,12));
  if(existsSync(folder)) {
    checkRepoAtPin(folder,spec.commit);
    console.log('Reusing verified clean '+name+' reference: '+spec.commit.slice(0,12));
    return folder;
  }
  console.log('Fetching pristine '+name+' source pinned at '+spec.commit.slice(0,12)+' (GitHub)...');
  // A fresh path is used; no git reset, clean, checkout or writes against the user's live install.
  git(['-c','core.longpaths=true','clone','--filter=blob:none','--single-branch','--depth','1','--branch',spec.branch,'--no-checkout',spec.url,folder]);
  if(git(['-C',folder,'rev-parse','HEAD'],true)!==spec.commit) {
    git(['-C',folder,'fetch','--depth','1','origin',spec.commit]);
  }
  git(['-c','core.longpaths=true','-C',folder,'checkout','--detach',spec.commit]);
  checkRepoAtPin(folder,spec.commit);
  return folder;
}
async function main() {
  const active=path.join(root,'runtime','jparris-377','active.json');
  if(!existsSync(active)) throw new Error('The installed game active.json is missing; run this script inside the existing launcher.');
  const state=await readUtf8Json(active);
  for(const type of ['engine','content','client']) {
    if(typeof state[type]!=='string'||!existsSync(state[type])) throw new Error('Missing installed '+type+' source; no changes made.');
  }
  const pinned=await readUtf8Json(path.join(root,'deploy','jparris-windows','upstreams.json'));
  for(const type of ['engine','content','client']) verifiedSpec(type,pinned[type]);
  await mkdir(path.join(docs,'baseline-pinned'),{recursive:true});
  const dirs={};
  for(const type of ['engine','content','client']) dirs[type]=ensurePin(type,pinned[type]);
  console.log('\nComparing live engine, content and Java client to the pristine pinned upstream...');
  const args=[
    path.join(root,'tools','portable-world','audit.mjs'),
    '--root',root,
    '--baseline-engine',dirs.engine,
    '--baseline-content',dirs.content,
    '--baseline-client',dirs.client
  ];
  const result=spawnSync(process.execPath,args,{stdio:'inherit'});
  if(result.error || result.status!==0) throw new Error('Inventory comparison did not finish; installed files remain unchanged.');
  console.log('PINNED_COMPARISON_COMPLETE. Share the newest inventory.json only; do not upload player saves or game folders.');
}
main().catch(e=>{console.error('PINNED_COMPARISON_NOT_COMPLETED: '+e.message);process.exitCode=1;});
