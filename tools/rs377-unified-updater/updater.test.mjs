import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {parsePatchPaths,planUpdate,applyAndBuild,parseArgs,assertStopped,readWorldSafetySettings} from './updater.mjs';

const QUESTS=['quest_fenkenstrain','quest_rag','quest_soulbane','quest_swansong',
  'quest_myreque','quest_ics','quest_mdaughter','quest_hauntedmine','quest_losttribe',
  'quest_makinghistory','quest_handsand','quest_feud','quest_elid','quest_osf',
  'quest_dwarfrock','quest_tog','quest_zogre','quest_giantdwarf','quest_forget',
  'quest_garden','quest_twocats','quest_wanted','quest_deal','quest_agrith'];
const EXTRA=[
 'scripts/areas/area_ahoy/scripts/ahoy_ghost_dialogue_377.rs2',
 'scripts/quests/quest_mortton/configs/quest_mortton.varp',
 'scripts/quests/quest_mortton/configs/joshrs_mortton_finish.constant',
 'scripts/quests/quest_mortton/scripts/joshrs_mortton_start.rs2',
 'scripts/quests/quest_mortton/scripts/joshrs_mortton_finish.rs2',
 'scripts/areas/area_lumbridge/scripts/joshrs_cook_millie_377.rs2',
 'scripts/areas/area_lumbridge/scripts/joshrs_cook_gillie_377.rs2'
];
const rel='scripts/example/quest.rs2';
function write(root,name,text) {
  const file=path.join(root,name);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,text);
  return file;
}
function fixture(t) {
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-unified-test-'));
  t.after(()=>fs.rmSync(base,{force:true,recursive:true}));
  const repo=path.join(base,'repo'),root=path.join(base,'world');
  const engine=path.join(root,'engine'),content=path.join(root,'content');
  const statePath=path.join(base,'test-state');
  const original='line one\nold behaviour\nline three\n';
  write(content,rel,original);
  write(engine,'data/pack/server/script.dat','script binary original');
  write(engine,'data/pack/server/script.idx','script index original');
  write(content,'pack/data.bin','original pack');
  write(engine,'data/players/main/TestDummy.sav','not a real player');
  write(engine,'db.sqlite','fake test DB bytes');
  write(engine,'db.sqlite-wal','fake WAL bytes');
  const patch=[
    'diff --git a/'+rel+' b/'+rel,
    '--- a/'+rel,'+++ b/'+rel,
    '@@ -1,3 +1,3 @@',' line one','-old behaviour','+fixed behaviour',' line three',''
  ].join('\n');
  write(repo,'content-patches/rs377/patches/0001-sample.patch',patch);
  for(const folder of QUESTS)for(const [n,v] of [['quest.rs2','[label,example]\n'],['config.varp','[example]\nscope=perm\n']])
    write(repo,'content-patches/rs377/scripts/quests/'+folder+'/'+n,v);
  for(const name of EXTRA)write(repo,'content-patches/rs377/'+name,
    name.includes('millie')?'[opnpc1,millie_the_miller]\n':name.includes('gillie')?'[opnpc1,gillie_the_milkmaid]\n':'[label,extra]\n');
  return {base,repo,world:{root,engine,content,origin:'test'},statePath,original,patch};
}
function plan(f) {return planUpdate(f.world,{repo:f.repo,minCount:1,statePathOverride:f.statePath});}

test('reject patch escape, renames, binary, duplicates, ambiguous launcher flags',()=>{
  assert.throws(()=>parsePatchPaths('diff --git a/../../etc/passwd b/../../etc/passwd'),/Unsafe/);
  assert.throws(()=>parsePatchPaths('diff --git a/scripts/a.rs2 b/scripts/b.rs2'),/Renames/);
  assert.throws(()=>parsePatchPaths('GIT binary patch'),/Binary/);
  assert.throws(()=>parsePatchPaths('diff --git a/scripts/a.rs2 b/scripts/a.rs2\ndiff --git a/scripts/a.rs2 b/scripts/a.rs2'),/unique/);
  assert.throws(()=>parseArgs(['--world','not-absolute']),/absolute/);
  assert.deepEqual(parseArgs(['--check']),{mode:'check',world:undefined,confirmed:false});
});
test('disposable plan never alters a source or save, and detects real patch difference',t=>{
  const f=fixture(t);
  const p=plan(f);
  assert.equal(p.patches.length,1);
  assert.equal(p.results[0].status,'pending');
  assert.ok(p.changed.get(rel).toString().includes('fixed behaviour'));
  assert.equal(fs.readFileSync(path.join(f.world.content,rel),'utf8'),f.original);
  assert.equal(fs.readFileSync(path.join(f.world.engine,'data/players/main/TestDummy.sav'),'utf8'),'not a real player');
  assert.equal(fs.existsSync(f.statePath),false);
});
test('successful update retains saves and can be rechecked without duplicating patches',t=>{
  const f=fixture(t);
  const first=plan(f);
  const result=applyAndBuild(first,{runBuild:()=>({status:0,stdout:'test compile passed',stderr:''})});
  assert.equal(result.changed>30,true);
  assert.equal(result.compiled,true);
  assert.equal(fs.readFileSync(path.join(f.world.content,rel),'utf8').includes('fixed behaviour'),true);
  assert.equal(fs.readFileSync(path.join(f.world.engine,'db.sqlite'),'utf8'),'fake test DB bytes');
  assert.equal(fs.readFileSync(path.join(f.world.engine,'db.sqlite-wal'),'utf8'),'fake WAL bytes');
  const next=plan(f);
  assert.equal(next.priorCount,1);
  assert.equal(next.changed.size,0);
  assert.equal(next.results.length,0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.statePath,'installed.json'))).liveGameplayVerified,false);
  assert.ok(fs.existsSync(path.join(result.backup,'saves/data/players/main/TestDummy.sav')));
});
test('failed compile restores sources, config pack, script pack and account/save bytes',t=>{
  const f=fixture(t);
  const first=plan(f);
  const oldIndex=fs.readFileSync(path.join(f.world.engine,'data/pack/server/script.idx'),'utf8');
  assert.throws(()=>applyAndBuild(first,{runBuild:()=>{
    write(f.world.engine,'data/pack/server/script.idx','bad compiled index');
    write(f.world.content,'pack/data.bin','corrupt content pack');
    return {status:1,stdout:'failure simulated',stderr:''};
  }}),/Native 377 build failed/);
  assert.equal(fs.readFileSync(path.join(f.world.content,rel),'utf8'),f.original);
  assert.equal(fs.readFileSync(path.join(f.world.engine,'data/pack/server/script.idx'),'utf8'),oldIndex);
  assert.equal(fs.readFileSync(path.join(f.world.content,'pack/data.bin'),'utf8'),'original pack');
  assert.equal(fs.readFileSync(path.join(f.world.engine,'data/players/main/TestDummy.sav'),'utf8'),'not a real player');
  assert.equal(fs.readFileSync(path.join(f.world.engine,'db.sqlite'),'utf8'),'fake test DB bytes');
  assert.equal(fs.existsSync(path.join(f.statePath,'installed.json')),false);
});
test('conflicting customised source blocks before writing anything',t=>{
  const f=fixture(t);
  write(f.world.content,'scripts/quests/quest_rag/quest.rs2','someone else wrote this');
  assert.throws(()=>plan(f),/conflicts/);
  assert.equal(fs.readFileSync(path.join(f.world.content,rel),'utf8'),f.original);
});
test('already-installed custom Millie handler is preserved instead of being doubled',t=>{
  const f=fixture(t);
  write(f.world.content,'scripts/custom/another_millie.rs2','[opnpc1,millie_the_miller]\n~chatnpc("hello");\n');
  const p=plan(f);
  assert.ok(p.results.some(x=>x.status==='preserved-existing-dialogue'));
  assert.equal(p.changed.has('scripts/areas/area_lumbridge/scripts/joshrs_cook_millie_377.rs2'),false);
});
test('new future numbered patch updates a prior manifest without reapplying old patches',t=>{
  const f=fixture(t);
  applyAndBuild(plan(f),{runBuild:()=>({status:0})});
  write(f.repo,'content-patches/rs377/patches/0002-second.patch',[
    'diff --git a/'+rel+' b/'+rel,'--- a/'+rel,'+++ b/'+rel,
    '@@ -1,3 +1,3 @@',' line one','-fixed behaviour','+even better behaviour',' line three',''
  ].join('\n'));
  const next=plan(f);
  assert.equal(next.priorCount,1);
  assert.equal(next.patches.length,2);
  assert.ok(next.changed.get(rel).toString().includes('even better behaviour'));
  applyAndBuild(next,{runBuild:()=>({status:0})});
  assert.equal(plan(f).changed.size,0);
});

test('existing saved character without matching SQLite database blocks before changes',t=>{
  const f=fixture(t);
  fs.unlinkSync(path.join(f.world.engine,'db.sqlite'));
  const before=fs.readFileSync(path.join(f.world.content,rel),'utf8');
  assert.throws(()=>applyAndBuild(plan(f),{runBuild:()=>({status:0})}),/matching SQLite account database/);
  assert.equal(fs.readFileSync(path.join(f.world.content,rel),'utf8'),before);
  assert.equal(fs.readFileSync(path.join(f.world.engine,'data/players/main/TestDummy.sav'),'utf8'),'not a real player');
});
test('non-SQLite database backend is refused before live installation',async t=>{
  const f=fixture(t);
  write(f.world.engine,'.env','NODE_PORT=15402\nWEB_PORT=18880\nDB_BACKEND=postgresql\n');
  await assert.rejects(()=>assertStopped(f.world),/SQLite backup only/);
});

test('world.json is authoritative for newer engines even if legacy .env omits backend',t=>{
  const f=fixture(t);
  write(f.world.engine,'.env','NODE_PORT=15402\nWEB_PORT=18880\n');
  write(f.world.engine,'data/config/world.json',JSON.stringify({
    db:{backend:'sqlite'},node:{port:15402},web:{port:18880,managementPort:18881}
  }));
  fs.writeFileSync(path.join(f.world.engine,'db.sqlite'),Buffer.concat([
    Buffer.from('SQLite format 3\0','ascii'),Buffer.alloc(128)
  ]));
  const settings=readWorldSafetySettings(f.world);
  assert.equal(settings.source,'world.json');
  assert.deepEqual(settings.ports,[15402,18880,18881]);
  assert.equal(settings.dbExists,true);
});
test('non-SQLite active world.json overrides seemingly safe legacy env and blocks',t=>{
  const f=fixture(t);
  write(f.world.engine,'.env','DB_BACKEND=sqlite\nNODE_PORT=15402\nWEB_PORT=18880\n');
  write(f.world.engine,'data/config/world.json',JSON.stringify({
    db:{backend:'mysql'},node:{port:15402},web:{port:18880}
  }));
  assert.throws(()=>readWorldSafetySettings(f.world),/SQLite backup only/);
});
test('quoted, exported legacy SQLite setting is accepted without rewriting config',t=>{
  const f=fixture(t);
  write(f.world.engine,'.env','  export DB_BACKEND = "sqlite"  \nNODE_PORT=15402\nWEB_PORT=18880\n');
  fs.writeFileSync(path.join(f.world.engine,'db.sqlite'),Buffer.concat([
    Buffer.from('SQLite format 3\0','ascii'),Buffer.alloc(128)
  ]));
  assert.equal(readWorldSafetySettings(f.world).source,'.env');
});
test('absent backend or malformed SQLite signature fails closed',t=>{
  const f=fixture(t);
  write(f.world.engine,'.env','NODE_PORT=15402\nWEB_PORT=18880\n');
  assert.throws(()=>readWorldSafetySettings(f.world),/SQLite backup only/);
  write(f.world.engine,'.env','DB_BACKEND=sqlite\nNODE_PORT=15402\nWEB_PORT=18880\n');
  assert.throws(()=>readWorldSafetySettings(f.world),/SQLite file signature/);
});
test('conflicting repeated backend declaration fails closed',t=>{
  const f=fixture(t);
  write(f.world.engine,'.env','DB_BACKEND=sqlite\nDB_BACKEND=mysql\nNODE_PORT=15402\nWEB_PORT=18880\n');
  assert.throws(()=>readWorldSafetySettings(f.world),/Conflicting duplicate/);
});

test('pinned 377-wip legacy Environment.ts explicitly proves a SQLite default',t=>{
  const f=fixture(t);
  write(f.world.engine,'.env','NODE_PORT=15402\nWEB_PORT=18880\n');
  write(f.world.engine,'src/util/Environment.ts',
    "DB_BACKEND: tryParseString(process.env.DB_BACKEND, 'sqlite'),\n");
  write(f.world.engine,'src/db/query.ts',
    "if (Environment.DB_BACKEND === 'sqlite') { database: new DatabaseSync('db.sqlite'); }\n");
  fs.writeFileSync(path.join(f.world.engine,'db.sqlite'),
    Buffer.concat([Buffer.from('SQLite format 3\0','ascii'),Buffer.alloc(128)]));
  const settings=readWorldSafetySettings(f.world);
  assert.equal(settings.source,'.env');
  assert.deepEqual(settings.ports,[15402,18880]);
});
test('legacy 377-wip defaults cannot be inferred from a missing selector branch',t=>{
  const f=fixture(t);
  write(f.world.engine,'.env','NODE_PORT=15402\nWEB_PORT=18880\n');
  write(f.world.engine,'src/util/Environment.ts',
    "DB_BACKEND: tryParseString(process.env.DB_BACKEND, 'sqlite'),\n");
  write(f.world.engine,'src/db/query.ts',"database: new DatabaseSync('db.sqlite')\n");
  assert.throws(()=>readWorldSafetySettings(f.world),/Cannot prove pinned 377/);
});
