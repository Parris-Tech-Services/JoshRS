#!/usr/bin/env node
// Guarded, OFFLINE / DISPOSABLE-ONLY installer for independent Skippy story slice.
// Never pass a running family-world content path; active data is explicitly refused.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const script=path.resolve(here,'../../expansions/rs377-miniquests/skippy/scripts/miniquest_skippy.rs2');
const dest='scripts/quests/miniquest_skippy/scripts/miniquest_skippy.rs2';
const requiredNpc=['2795=multi_skippy','2796=skippy','2797=damp_skippy','2798=hungover_skippy','2799=sober_skippy'];
const requiredObj=['1929=bucket_water','1925=bucket_empty','4239=bowl_nettletea','4242=cup_of_nettletea','1923=bowl_empty','1980=cup_empty','1504=hangover_cure'];

export function install(contentDir,{apply=false}={}){
  if(!contentDir||!path.isAbsolute(contentDir))throw new Error('Require absolute --content path');
  const absolute=path.resolve(contentDir);
  const normalized=absolute.replace(/\\/g,'/').toLowerCase();
  if(/(?:^|\/)(?:joshrs-launcher|runtime|jparris-377)(?:\/|$)/.test(normalized))
    throw new Error('REFUSED: active family runtime/launcher tree');
  if(!fs.existsSync(absolute))throw new Error('Content directory does not exist');
  const resolved=fs.realpathSync(absolute);
  const realNorm=resolved.replace(/\\/g,'/').toLowerCase();
  if(/(?:^|\/)(?:joshrs-launcher|runtime|jparris-377)(?:\/|$)/.test(realNorm))
    throw new Error('REFUSED: content directory resolves to active family runtime');

  const npc=fs.readFileSync(path.join(resolved,'pack/npc.pack'),'utf8');
  const obj=fs.readFileSync(path.join(resolved,'pack/obj.pack'),'utf8');
  const varbit=fs.readFileSync(path.join(resolved,'pack/varbit.pack'),'utf8');
  for(const line of requiredNpc)if(!npc.split(/\r?\n/).includes(line))throw new Error('Wrong NPC pack; missing '+line);
  for(const line of requiredObj)if(!obj.split(/\r?\n/).includes(line))throw new Error('Wrong obj pack; missing '+line);
  if(!varbit.split(/\r?\n/).includes('1344=skippy_state'))throw new Error('Wrong varbit pack');
  if(!fs.existsSync(path.join(resolved,'scripts/quests')))throw new Error('Not a 377 Content tree');

  const target=path.join(resolved,dest);
  const expected=fs.readFileSync(script,'utf8');
  if(fs.existsSync(target)){
    const current=fs.readFileSync(target,'utf8');
    if(current===expected)return {status:'already-installed',changed:false,path:target};
    throw new Error('Existing Skippy implementation differs: refusing overwrite');
  }
  if(!apply)return {status:'dry-run-only',changed:false,path:target};
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,expected,{flag:'wx'});
  return {status:'installed-to-disposable-copy',changed:true,path:target};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const i=process.argv.indexOf('--content');
    if(i<0||!process.argv[i+1])throw new Error('Usage: node apply-skippy.mjs --content <ABSOLUTE DISPOSABLE 377 CONTENT PATH> [--apply]');
    const r=install(process.argv[i+1],{apply:process.argv.includes('--apply')});
    console.log(JSON.stringify(r,null,2));
    console.log('STORY ONLY. Mogre combat unlock and full miniquest gameplay NOT YET VERIFIED.');
  }catch(error){console.error(error.message);process.exitCode=1}
}
