import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {install} from './apply.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const base=path.resolve(here,'../../expansions/rs377-quests/royal-trouble');
const script=fs.readFileSync(path.join(base,'scripts/royal_trouble_investigation.rs2'),'utf8');
const constants=fs.readFileSync(path.join(base,'configs/joshrs_royal_trouble.constant'),'utf8');
const varp=fs.readFileSync(path.join(base,'configs/joshrs_royal_trouble.varp'),'utf8');
const npcs=[1359,1361,1362,1364,1365,1371,1372,1373,1375,1385,1395,1396,1397,1398];
const names=['misc_queen_sigrid','misc_etc_man_1','misc_etc_man_2','misc_etc_woman_1','misc_etc_woman_2','misc_prince_brand','misc_princess_astrid','misc_king_vargas','misc_advisor_ghrim','misc_sailor','misc_lumberjack','misc_miner','misc_fisherman','misc_gardener'];
function fixture(callback){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'royal-trouble-377-'));
 try {
   fs.mkdirSync(path.join(tmp,'pack'),{recursive:true});
   fs.mkdirSync(path.join(tmp,'scripts/quests'),{recursive:true});
   fs.writeFileSync(path.join(tmp,'.joshrs-disposable-content'),'TEST ONLY\n');
   fs.writeFileSync(path.join(tmp,'pack/npc.pack'),npcs.map((n,i)=>n+'='+names[i]).join('\n')+'\n');
   fs.writeFileSync(path.join(tmp,'pack/varp.pack'),'359=misc_quest\n724=varp_724\n');
   return callback(tmp);
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
}
test('disposable installer dry-run, apply, idempotence, no other files',()=>fixture(root=>{
 const dest=path.join(root,'scripts/quests/quest_royal_trouble');
 const a=install(root);
 assert.equal(a.changed,false);
 assert.equal(fs.existsSync(dest),false);
 const b=install(root,{apply:true});
 assert.equal(b.changed,true);
 assert.equal(b.created,4);
 assert.match(fs.readFileSync(path.join(root,'pack/varp.pack'),'utf8'),/725=joshrs_royaltrouble/);
 assert.equal(install(root,{apply:true}).changed,false);
 assert.equal(fs.readFileSync(path.join(dest,'configs/joshrs_royal_trouble.varp'),'utf8'),varp);
 assert.equal(fs.readFileSync(path.join(dest,'scripts/royal_trouble_investigation.rs2'),'utf8'),script);
}));
test('refuse unmarked or active family install, wrong packs, altered target',()=>fixture(root=>{
 fs.rmSync(path.join(root,'.joshrs-disposable-content'));
 assert.throws(()=>install(root,{apply:true}),/missing disposable marker/);
 fs.writeFileSync(path.join(root,'.joshrs-disposable-content'),'test');
 const live=path.join(root,'jparris-377','content');
 fs.mkdirSync(live,{recursive:true});
 assert.throws(()=>install(live,{apply:true}),/family installation/);
 fs.writeFileSync(path.join(root,'pack/varp.pack'),'bad');
 assert.throws(()=>install(root,{apply:true}),/Missing pinned 377 Throne varp/);
 fs.writeFileSync(path.join(root,'pack/varp.pack'),'359=misc_quest\n724=varp_724\n');
 fs.appendFileSync(path.join(root,'pack/varp.pack'),'725=another_quest\\n');
 assert.throws(()=>install(root,{apply:true}),/varp 725 already belongs/);
 fs.writeFileSync(path.join(root,'pack/varp.pack'),'359=misc_quest\\n724=varp_724\\n');
 const target=path.join(root,'scripts/quests/quest_royal_trouble/configs/joshrs_royal_trouble.constant');
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,'CUSTOM\n');
 assert.throws(()=>install(root,{apply:true}),/already differs/);
 assert.equal(fs.readFileSync(target,'utf8'),'CUSTOM\n');
 assert.equal(fs.existsSync(path.join(root,'scripts/quests/quest_royal_trouble/scripts')),false);
}));
test('never shadow existing Throne or worker dialogue handlers',()=>fixture(root=>{
 const file=path.join(root,'scripts/quests/existing.rs2');
 fs.writeFileSync(file,'[opnpc1,misc_advisor_ghrim]\nmes("Hello");\n');
 assert.throws(()=>install(root,{apply:true}),/existing quest\/NPC dialogue handler/);
 assert.equal(fs.existsSync(path.join(root,'scripts/quests/quest_royal_trouble')),false);
}));
test('source declares complete investigation chain and native character handlers',()=>{
 assert.match(varp,/\[joshrs_royaltrouble\]\s+scope=perm/);
 for(const name of names)assert.ok(script.includes('[opnpc1,'+name+']'),'Missing '+name);
 for(let stage=0;stage<=12;stage++)assert.match(constants,new RegExp('\\^rt_\\w+ = '+stage+'(?:\\s|$)'));
 const gates=['misc_quest < ^rt_throne_completion_hold','^rt_ghrim_briefing','^rt_royal_children','^rt_king_investigation','^rt_misc_worker','^rt_king_queen_referral','^rt_queen_investigation','^rt_etc_worker','^rt_queen_report','^rt_king_mystery','^rt_ghrim_docks_referral','^rt_sailor_report','^rt_king_dungeon_permission'];
 for(const marker of gates)assert.ok(script.includes(marker),'Missing state '+marker);
 assert.ok(script.indexOf('misc_quest < ^rt_throne_completion_hold')<script.indexOf('%joshrs_royaltrouble = ^rt_ghrim_briefing'));
});
test('no fictitious dungeon/boss kill, quest completion or rewards',()=>{
 for(const invalid of ['send_quest_complete','stat_advance(','inv_add(','p_teleport(','p_telejump(','queue(','npc_add(','stat_set(','^rt_complete'])
   assert.equal(script.includes(invalid),false,'Unexpected unearned progression: '+invalid);
 assert.match(script,/dungeon content is not yet implemented/);
 assert.doesNotMatch(script,/<p,worried>/);
});
