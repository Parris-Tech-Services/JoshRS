import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { install } from './apply-skippy.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const source=fs.readFileSync(path.resolve(here,'../../expansions/rs377-miniquests/skippy/scripts/miniquest_skippy.rs2'),'utf8');

const npcs=['2795=multi_skippy','2796=skippy','2797=damp_skippy','2798=hungover_skippy','2799=sober_skippy'];
const objs=['1929=bucket_water','1925=bucket_empty','4239=bowl_nettletea','4242=cup_of_nettletea','1923=bowl_empty','1980=cup_empty','1504=hangover_cure'];

function fixture(fn){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'rs377-skippy-'));
  try{
    for(const p of ['pack','scripts/quests'])fs.mkdirSync(path.join(root,p),{recursive:true});
    fs.writeFileSync(path.join(root,'pack/npc.pack'),npcs.join('\n'));
    fs.writeFileSync(path.join(root,'pack/obj.pack'),objs.join('\n'));
    fs.writeFileSync(path.join(root,'pack/varbit.pack'),'1344=skippy_state\n');
    return fn(root);
  }finally{fs.rmSync(root,{recursive:true,force:true})}
}

test('dry-run does not install anything, applied copy is idempotent and refuses overwritten script',()=>fixture(root=>{
  const target=path.join(root,'scripts/quests/miniquest_skippy/scripts/miniquest_skippy.rs2');
  assert.equal(install(root).changed,false);
  assert.equal(fs.existsSync(target),false);
  assert.equal(install(root,{apply:true}).changed,true);
  assert.equal(fs.readFileSync(target,'utf8'),source);
  assert.equal(install(root,{apply:true}).changed,false);
  fs.writeFileSync(target,'CUSTOM PLAYER CHANGE');
  assert.throws(()=>install(root,{apply:true}),/refusing overwrite/);
}));

test('refuse family launcher/runtime regardless of --apply, and reject wrong packs',()=>fixture(root=>{
  assert.throws(()=>install(path.join(root,'JoshRS-Launcher','content'),{apply:true}),/REFUSED/);
  assert.throws(()=>install(path.join(root,'runtime','jparris-377','content'),{apply:true}),/REFUSED/);
  fs.writeFileSync(path.join(root,'pack/varbit.pack'),'1=unrelated');
  assert.throws(()=>install(root,{apply:true}),/Wrong varbit pack/);
}));

test('source contracts: five Skippy variants and both ordinary item interaction modes',()=>{
  for(const name of ['multi_skippy','skippy','damp_skippy','hungover_skippy','sober_skippy']){
    assert.ok(source.includes('[opnpc1,'+name+']'));
    assert.ok(source.includes('[opnpcu,'+name+']'));
  }
  for(const [stage,item] of [[0,'bucket_water'],[1,'bowl_nettletea'],[2,'hangover_cure']]){
    assert.ok(source.includes('%skippy_state = '+stage+' & last_useitem = '+item));
  }
  for(const stage of [1,2,3])assert.ok(source.includes('%skippy_state = '+stage+';'));
  assert.ok(source.includes('last_useitem = cup_of_nettletea'));
  for(const item of ['bucket_water','bowl_nettletea','cup_of_nettletea','hangover_cure'])
    assert.ok(source.includes('inv_del(inv, '+item+', 1)'),'Expected item consumption '+item);
  assert.match(source, /inv_add\(inv, bucket_empty, 1\)/);
  assert.doesNotMatch(source,/p_telejump|p_teleport|npc_add|stat_advance|setvarp/);
});

test('completion scope is explicit: does not pretend generic mogre NPC exists',()=>{
  assert.match(source, /Mogre-spawn\/Slayer mechanics are separate/);
  assert.match(source, /%skippy_state = 3;/);
  assert.match(source, /No verbatim Jagex dialogue or cache assets/);
});
