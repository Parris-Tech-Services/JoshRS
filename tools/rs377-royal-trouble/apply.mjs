#!/usr/bin/env node
// Strictly disposable Royal Trouble investigation overlay, never for family install.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../..');
const base='expansions/rs377-quests/royal-trouble/';
const files=[
  ['configs/joshrs_royal_trouble.varp','scripts/quests/quest_royal_trouble/configs/joshrs_royal_trouble.varp'],
  ['configs/joshrs_royal_trouble.constant','scripts/quests/quest_royal_trouble/configs/joshrs_royal_trouble.constant'],
  ['scripts/royal_trouble_investigation.rs2','scripts/quests/quest_royal_trouble/scripts/royal_trouble_investigation.rs2']
];
const requiredNpcs=['1359=misc_queen_sigrid','1371=misc_prince_brand','1372=misc_princess_astrid','1373=misc_king_vargas','1375=misc_advisor_ghrim','1385=misc_sailor','1395=misc_lumberjack','1396=misc_miner','1397=misc_fisherman','1398=misc_gardener','1361=misc_etc_man_1','1362=misc_etc_man_2','1364=misc_etc_woman_1','1365=misc_etc_woman_2'];
const handlers=['misc_queen_sigrid','misc_prince_brand','misc_princess_astrid','misc_king_vargas','misc_advisor_ghrim','misc_sailor','misc_lumberjack','misc_miner','misc_fisherman','misc_gardener','misc_etc_man_1','misc_etc_man_2','misc_etc_woman_1','misc_etc_woman_2'];

export function install(root,{apply=false}={}){
  if(!root||!path.isAbsolute(root))throw Error('Use absolute --content disposable path');
  const absolute=path.resolve(root);
  const real=fs.realpathSync(absolute);
  const norm=real.replace(/\\/g,'/').toLowerCase();
  if(/(?:^|\/)(?:joshrs-launcher|jparris-377|runtime|active)(?:\/|$)/.test(norm))
    throw Error('REFUSED: family installation/runtime path');
  if(!fs.existsSync(path.join(real,'.joshrs-disposable-content')))
    throw Error('REFUSED: missing disposable marker; never mark family content');
  const npc=fs.readFileSync(path.join(real,'pack/npc.pack'),'utf8').split(/\r?\n/);
  for(const n of requiredNpcs)if(!npc.includes(n))throw Error('Wrong 377 NPC pack, missing '+n);
  const varp=fs.readFileSync(path.join(real,'pack/varp.pack'),'utf8').split(/\r?\n/);
  if(!varp.includes('359=misc_quest'))throw Error('Missing pinned 377 Throne varp');

  // All conflicts are checked before ANY file is written. Do not shadow
  // an existing Throne/Miscellania NPC dialogue handler.
  const tgt=files.map(([src,dst])=>({source:fs.readFileSync(path.join(repo,base,src),'utf8'),dest:path.join(real,dst)}));
  const conflicts=tgt.filter(f=>fs.existsSync(f.dest)&&fs.readFileSync(f.dest,'utf8')!==f.source);
  if(conflicts.length)throw Error('REFUSED: a Royal Trouble file already differs in this content copy');

  const scripts=path.join(real,'scripts');
  const excluded=new Set(tgt.map(t=>path.resolve(t.dest)));
  function scan(dir){
    if(!fs.existsSync(dir))return;
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const file=path.join(dir,entry.name);
      if(entry.isDirectory())scan(file);
      else if(entry.isFile()&&entry.name.endsWith('.rs2')&&!excluded.has(path.resolve(file))){
        const s=fs.readFileSync(file,'utf8');
        for(const npc of handlers){
          if(s.includes('[opnpc1,'+npc+']'))throw Error('REFUSED: existing quest/NPC dialogue handler for '+npc+' in '+file);
        }
      }
    }
  }
  scan(scripts);
  if(!apply)return {status:'validated-dry-run',changed:false,files:files.length};
  let created=0;
  for(const f of tgt){
    if(fs.existsSync(f.dest))continue;
    fs.mkdirSync(path.dirname(f.dest),{recursive:true});
    fs.writeFileSync(f.dest,f.source,{flag:'wx'});
    created++;
  }
  return {status:'disposable-overlay-only',changed:created>0,created};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const at=process.argv.indexOf('--content');
    if(at<0||!process.argv[at+1])throw Error('Usage: node apply.mjs --content /absolute/disposable-377-content [--apply]');
    const result=install(process.argv[at+1],{apply:process.argv.includes('--apply')});
    console.log(JSON.stringify(result));
    console.log('Only the Royal Trouble investigation is implemented; dungeon, sea snake and rewards remain blocked.');
  }catch(e){console.error(e.message);process.exitCode=1}
}
