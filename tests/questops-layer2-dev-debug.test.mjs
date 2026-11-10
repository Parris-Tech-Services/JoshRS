import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mapName, parseMap, inspectMap, nearby, varDefinition, stageDefinition } from '../tools/questops/dev-debug/inspect.mjs';

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'joshrs-devdebug-'));
    t.after(() => rmSync(root,{ recursive: true, force: true }));
    mkdirSync(join(root,'maps'));
    mkdirSync(join(root,'pack'));
    return root;
}
function put(root,path,body) {
    const file = join(root,path);
    mkdirSync(dirname(file),{recursive:true});
    writeFileSync(file,body);
}
function sample(npcRows = []) {
    return ['==== MAP ====', '0 0 0: u48', '1 35 18: h30 u48', // real 274 terrain rows
        '==== NPC ====', ...npcRows,'==== LOC ====', '1 35 18: 200',
        '==== OBJ ====', ''].join('\n');
}

test('map name matches 64x64 RuneScape coordinates including Uzer', () => {
    assert.equal(mapName(54*64+35,48*64+18),'m54_48.jm2');
    assert.equal(mapName(3210,3219),'m50_50.jm2');
});

test('map query reports missing region, exact tile and level without false clear', (t) => {
    const dir=fixture(t), x=54*64+35,z=48*64+18;
    assert.equal(inspectMap(dir,x,z,1).status,'MISSING_MAP');
    put(dir,'maps/m54_48.jm2',sample(['1 35 18: 0']));
    const found=inspectMap(dir,x,z,1);
    assert.equal(found.status,'TERRAIN_AT_TILE');
    assert.equal(found.counts.npc,1);
    assert.equal(found.counts.map,2);
    assert.equal(inspectMap(dir,x,z,0).status,'NO_TERRAIN_AT_TILE');
    put(dir,'maps/m54_48.jm2',sample(['invalid spawn line']));
    assert.equal(inspectMap(dir,x,z,1).status,'MALFORMED_MAP');
});

test('nearby lists static NPCs across region boundaries; ID 0 remains valid', (t) => {
    const dir=fixture(t);
    put(dir,'pack/npc.pack','0=sigmund\n2079=lost_tribe_sigmund\n');
    put(dir,'maps/m0_0.jm2',sample(['1 63 9: 0']));
    put(dir,'maps/m1_0.jm2',sample(['1 0 10: 2079','0 0 10: 2079']));
    const q=nearby(dir,64,9,1,2,'lost_tribe_sigmund');
    assert.equal(q.found,true);
    assert.deepEqual(q.spawns.map(x=>x.id).sort((a,b)=>a-b),[0,2079]);
    assert.equal(q.spawns.find(x=>x.id===0).x,63);
    assert.equal(nearby(dir,64,9,1,2,'other').status,'EXPECTED_NPC_MISSING');
});

test('a varp registered in the pack needs a definition somewhere under scripts/ (any revision folder)', (t) => {
    // Corrected: the packer reads every _unpack/<revision> folder, so a definition in 225 is active.
    const dir=fixture(t);
    put(dir,'pack/varp.pack','17=losttribe\n');
    assert.equal(varDefinition(dir,'losttribe').status,'NO_ACTIVE_DEFINITION');
    put(dir,'scripts/_unpack/225/all.varp','[losttribe]\nscope=perm\n');
    const v=varDefinition(dir,'losttribe');
    assert.equal(v.status,'REGISTERED');
    assert.equal(v.permanent,true);
    assert.equal(v.id,17);
    assert.equal(v.value,null);
    assert.equal(v.staticOnly,true);
});

test('quest stage finds evidence-based varp candidate but does not invent runtime value', (t) => {
    const dir=fixture(t);
    put(dir,'pack/varp.pack','17=losttribe\n');
    put(dir,'scripts/_unpack/274/all.varp','[losttribe]\nscope=perm\n');
    put(dir,'scripts/quests/quest_losttribe/scripts/start.rs2','if %losttribe == ^losttribe_complete\n');
    const v=stageDefinition(dir,'quest_losttribe');
    assert.equal(v.status,'STAGE_VAR_CANDIDATE');
    assert.equal(v.stageVar,'losttribe');
    assert.equal(v.variable.permanent,true);
    assert.equal(v.currentStage,null);
});

test('CLI exits nonzero for black map and prints machine-readable JSON', (t) => {
    const dir=fixture(t);
    const script=new URL('../tools/questops/dev-debug/inspect.mjs',import.meta.url).pathname;
    const p=spawnSync('node',[script,'map','--content',dir,'--x',String(54*64),'--z',String(48*64),'--json'],{encoding:'utf8'});
    assert.equal(p.status,1,p.stdout+p.stderr);
    assert.equal(JSON.parse(p.stdout).status,'MISSING_MAP');
    const bad=spawnSync('node',[script,'near','--content','/tmp/lc274/content','--x','1','--z','1'],{encoding:'utf8'});
    assert.equal(bad.status,2);
    assert.match(bad.stderr,/BLOCKED/);
});

// Regressions found by running against real LostCityRS 274 content.
test('real terrain rows ("h30 u48") parse; they were all reported MALFORMED_MAP', () => {
    const m = parseMap('==== MAP ====\n0 0 2: h30 u48\n0 0 3: u50\n==== NPC ====\n0 1 1: 7\n');
    assert.equal(m.MAP.length, 2);
    assert.equal(m.malformed.length, 0);
    assert.equal(m.NPC[0].id, 7);
});

test('a varbit stage var reports persistence from its base varp', (t) => {
    const dir = fixture(t);
    put(dir, 'pack/varbit.pack', '34=horrorquest\n');
    put(dir, 'pack/varp.pack', '100=deephorror\n');
    put(dir, 'scripts/quests/quest_horror/configs/h.varbit', '[horrorquest]\nbasevar=deephorror\nstartbit=0\n');
    put(dir, 'scripts/quests/quest_horror/configs/h.varp', '[deephorror]\nscope=perm\n');
    const v = varDefinition(dir, 'horrorquest');
    assert.equal(v.status, 'REGISTERED');
    assert.equal(v.type, 'varbit');
    assert.equal(v.basevar, 'deephorror');
    assert.equal(v.permanent, true);
});

test('stage var comes from count_questpoints when a quest has several ^..._complete checks', (t) => {
    const dir = fixture(t);
    put(dir, 'pack/varp.pack', '1=elenaquest\n2=elena_side\n');
    put(dir, 'scripts/general/configs/q.varp', '[elenaquest]\nscope=perm\n[elena_side]\nscope=perm\n');
    put(dir, 'scripts/general/scripts/quests.rs2', '[proc,count_questpoints]()(int)\nif (%elenaquest = ^elena_complete) {}\n[proc,other]\n');
    put(dir, 'scripts/quests/quest_elena/scripts/e.rs2',
        'if (%elenaquest = ^elena_complete) {}\nif (%elena_side = ^elena_complete_read_scroll) {}\n');
    const s = stageDefinition(dir, 'quest_elena');
    assert.equal(s.status, 'STAGE_VAR_CANDIDATE');
    assert.equal(s.stageVar, 'elenaquest');
    assert.equal(s.source, 'count_questpoints');
});

test('every _unpack revision is live: a stock varp in 225 is found, and a second copy is a duplicate', (t) => {
    const dir = fixture(t);
    put(dir, 'pack/varp.pack', '5=qp\n');
    put(dir, 'scripts/_unpack/225/all.varp', '[qp]\ntransmit=yes\n');
    const stock = varDefinition(dir, 'qp');
    assert.equal(stock.status, 'REGISTERED');
    assert.equal(stock.permanent, false);          // stock qp is recomputed at login, not saved
    put(dir, 'scripts/_unpack/274/all.varp', '[qp]\nscope=perm\n');
    const dup = varDefinition(dir, 'qp');
    assert.equal(dup.status, 'DUPLICATE_DEFINITION');
    assert.equal(dup.alsoDefinedIn.length, 1);
});
