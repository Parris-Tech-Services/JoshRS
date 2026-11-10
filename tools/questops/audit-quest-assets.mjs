#!/usr/bin/env node
// Audit ported quests against the *registries*, not the packing result.
//
// "It packs" proves syntax. A quest is not playable if its NPC symbols are unregistered, its stage
// vars collide across the four config namespaces, or its handlers point at labels that do not exist.
// This walks each ported quest and reports what is actually resolvable.
//
// Usage: audit-quest-assets.mjs <content-dir> [--json]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const content = process.argv[2];
if (!content) {
    console.error('usage: audit-quest-assets.mjs <content-dir>');
    process.exit(2);
}
const asJson = process.argv.includes('--json');

function walk(dir, ext, out = []) {
    if (!existsSync(dir)) return out;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p, ext, out);
        else if (e.name.endsWith(ext)) out.push(p);
    }
    return out;
}

/** Parse a `id=name` pack file into name -> id. */
function loadPack(file) {
    const m = new Map();
    if (!existsSync(file)) return m;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!line.includes('=')) continue;
        const [id, name] = line.split('=', 1).concat();
        const parts = line.split('=');
        if (parts.length < 2) continue;
        m.set(parts[1].trim(), Number(parts[0]));
    }
    return m;
}

const npcPack = loadPack(join(content, 'pack/npc.pack'));
const locPack = loadPack(join(content, 'pack/loc.pack'));
const objPack = loadPack(join(content, 'pack/obj.pack'));
const varpPack = loadPack(join(content, 'pack/varp.pack'));
const varbitPack = loadPack(join(content, 'pack/varbit.pack'));
const varnPack = loadPack(join(content, 'pack/varn.pack'));
const varsPack = loadPack(join(content, 'pack/vars.pack'));

// all.npc / all.varp carry definitions; a symbol in a pack without a definition is unusable.
const unpack = join(content, 'scripts/_unpack');
const revDirs = existsSync(unpack) ? readdirSync(unpack) : [];
const npcDefs = new Set();
const varDefs = new Set();
for (const rev of revDirs) {
    const npcFile = join(unpack, rev, 'all.npc');
    if (existsSync(npcFile)) {
        for (const m of readFileSync(npcFile, 'utf8').matchAll(/^\[([a-z0-9_]+)\]/gim)) npcDefs.add(m[1]);
    }
    const varFile = join(unpack, rev, 'all.varp');
    if (existsSync(varFile)) {
        for (const m of readFileSync(varFile, 'utf8').matchAll(/^\[([a-z0-9_]+)\]/gim)) varDefs.add(m[1]);
    }
}

const questsDir = join(content, 'scripts/quests');
const PORTED = new Set([
    'quest_agrith', 'quest_deal', 'quest_dwarfrock', 'quest_elid', 'quest_fenkenstrain', 'quest_feud',
    'quest_forget', 'quest_garden', 'quest_giantdwarf', 'quest_golem', 'quest_handsand', 'quest_hauntedmine',
    'quest_ics', 'quest_losttribe', 'quest_makinghistory', 'quest_mdaughter', 'quest_myreque', 'quest_osf',
    'quest_rag', 'quest_soulbane', 'quest_swansong', 'quest_tog', 'quest_troll_love', 'quest_twocats',
    'quest_wanted', 'quest_zogre',
]);

const rows = [];
for (const name of readdirSync(questsDir).filter((n) => PORTED.has(n)).sort()) {
    const dir = join(questsDir, name);
    const scripts = walk(join(dir, 'scripts'), '.rs2');
    const text = scripts.map((f) => readFileSync(f, 'utf8')).join('\n');

    // Interaction handlers name a symbol and a registry: opnpc -> npc, oploc -> loc, opheld -> obj.
    // Treating them as one namespace produced false "missing NPC" reports for objects and scenery.
    const byKind = (k) => [...new Set([...text.matchAll(new RegExp(`\\[op${k}\\d+,([a-z0-9_]+)\\]`, 'gi'))].map((m) => m[1]))];
    const npcRefs = byKind('npc');
    const locRefs = byKind('loc');
    const objRefs = byKind('held');
    const missingNpc = npcRefs.filter((s) => !npcPack.has(s));
    const missingLoc = locRefs.filter((s) => !locPack.has(s));
    const missingObj = objRefs.filter((s) => !objPack.has(s));
    const unregisteredNpc = npcRefs.filter((s) => npcPack.has(s) && !npcDefs.has(s));

    // Stage variables
    const varRefs = [...new Set([...text.matchAll(/%([a-z0-9_]+)/gi)].map((m) => m[1]))]
        .filter((v) => !v.startsWith('varp_') && v.length > 1);
    const knownVar = (v) => varpPack.has(v) || varbitPack.has(v) || varnPack.has(v) || varsPack.has(v);
    const missingVars = varRefs.filter((v) => !knownVar(v));

    // Cross-registry collisions inside this quest's own vars
    const owned = (v) => ['varp', 'varbit', 'varn', 'vars'].filter((k) =>
        ({ varp: varpPack, varbit: varbitPack, varn: varnPack, vars: varsPack })[k].has(v));
    const collisions = varRefs.filter((v) => owned(v).length > 1);

    const hasJournal = /questlist:/i.test(text);
    const hasComplete = /send_quest_complete/i.test(text);
    const hasReward = /stat_advance|inv_add/i.test(text);

    // Verdict: only structural evidence. Nothing here proves a playthrough.
    const blockers = [];
    if (missingNpc.length) blockers.push(`${missingNpc.length} NPC symbol(s) unregistered`);
    if (missingLoc.length) blockers.push(`${missingLoc.length} loc symbol(s) unregistered`);
    if (missingObj.length) blockers.push(`${missingObj.length} obj symbol(s) unregistered`);
    if (unregisteredNpc.length) blockers.push(`${unregisteredNpc.length} NPC without definition`);
    if (missingVars.length) blockers.push(`${missingVars.length} unregistered var(s)`);
    if (collisions.length) blockers.push(`${collisions.length} cross-registry var collision(s)`);
    if (!hasJournal) blockers.push('no journal entry');
    if (!hasComplete) blockers.push('no completion call');
    if (!hasReward) blockers.push('no reward');

    const status = blockers.length === 0 ? 'STRUCTURALLY COMPLETE' : (blockers.length <= 2 ? 'PARTIALLY WORKING' : 'BLOCKED');
    rows.push({ name, npcRefs: npcRefs.length, locRefs: locRefs.length, objRefs: objRefs.length,
        missingNpc, missingLoc, missingObj, unregisteredNpc, missingVars, collisions,
        hasJournal, hasComplete, hasReward, blockers, status });
}

if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
} else {
    const counts = rows.reduce((a, r) => (a[r.status] = (a[r.status] ?? 0) + 1, a), {});
    console.log(`| Quest | NPC refs | Journal | Complete | Reward | Status | Blockers |`);
    console.log(`|---|---|---|---|---|---|---|`);
    for (const r of rows) {
        const t = (b) => (b ? 'yes' : '**no**');
        console.log(`| \`${r.name}\` | ${r.npcRefs} | ${t(r.hasJournal)} | ${t(r.hasComplete)} | ${t(r.hasReward)} | ${r.status} | ${r.blockers.join('; ') || '—'} |`);
    }
    console.log();
    console.log(JSON.stringify(counts));
    console.log('\nNOTE: status is structural only. No quest here has been played; none is VERIFIED PLAYABLE.');
}
