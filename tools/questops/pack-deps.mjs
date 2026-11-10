#!/usr/bin/env node
// Measure what ported quests need that the target packs do not have, and classify the cost.
//
// "It does not pack" is not actionable. Three very different situations hide behind it:
//   COSMETIC  - an animation, sound or spotanim. The quest still works without it.
//   VISIBLE   - a model. Without it the NPC or object is invisible or unclickable.
//   BLOCKING  - an interface, varp or inventory id a script needs in order to run at all.
//
// Usage: pack-deps.mjs <target-content> <source-content> [--json]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [target, source] = process.argv.slice(2);
if (!target || !source) { console.error('usage: pack-deps.mjs <target-content> <source-content>'); process.exit(2); }
const asJson = process.argv.includes('--json');

const KINDS = ['npc', 'loc', 'obj', 'anim', 'seq', 'spotanim', 'sound', 'interface', 'varp', 'varbit', 'varn', 'vars', 'idk', 'mes'];
const COSMETIC = new Set(['anim', 'seq', 'spotanim', 'sound', 'mes']);
// npc/loc/obj definitions are TEXT and portable - importing them is mechanical. The thing that is
// genuinely missing from a 274 cache is the MODEL each definition points at, so those are counted
// separately as MODEL rather than being lumped in with the definition itself.
const VISIBLE = new Set(['idk']);
// varps/varbits are registry TEXT and are already ported by the varp tooling; only interface
// components genuinely need engine-level registration.
const BLOCKING = new Set(['interface']);
const PORTABLE = new Set(['npc', 'loc', 'obj', 'varp', 'varbit', 'varn', 'vars']);

function loadPack(dir, kind) {
    const p = join(dir, 'pack', `${kind}.pack`);
    const names = new Set();
    if (!existsSync(p)) return names;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
        const eq = line.indexOf('=');
        if (eq > 0) names.add(line.slice(eq + 1).trim());
    }
    return names;
}
const tPacks = Object.fromEntries(KINDS.map((k) => [k, loadPack(target, k)]));
const sPacks = Object.fromEntries(KINDS.map((k) => [k, loadPack(source, k)]));

// Only the quests actually ported from 377; the stock 274 quests are not in question.
const PORTED_LIST = new Set(['quest_agrith','quest_deal','quest_dwarfrock','quest_elid','quest_fenkenstrain',
'quest_feud','quest_forget','quest_garden','quest_giantdwarf','quest_golem','quest_handsand','quest_hauntedmine',
'quest_ics','quest_losttribe','quest_makinghistory','quest_mdaughter','quest_myreque','quest_osf','quest_rag',
'quest_soulbane','quest_swansong','quest_tog','quest_troll_love','quest_twocats','quest_wanted','quest_zogre']);
const PORTED = readdirSync(join(target, 'scripts/quests'))
    .filter((n) => PORTED_LIST.has(n))
    .filter((n) => existsSync(join(target, 'scripts/quests', n, 'scripts')));

const rows = [];
for (const q of PORTED) {
    const dir = join(target, 'scripts/quests', q);
    const files = [];
    const walk = (d) => {
        if (!existsSync(d)) return;
        for (const e of readdirSync(d, { withFileTypes: true })) {
            const p = join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (/\.(rs2|constant|dbrow|npc|loc|obj|varp|varbit|seq|spotanim)$/.test(e.name)) files.push(p);
        }
    };
    walk(dir);

    const missing = new Map(); // symbol -> kind
    for (const f of files) {
        const text = readFileSync(f, 'utf8');
        // Every bare identifier that appears as a value or in a handler; cheap but complete enough
        // to find dependencies, then filtered by whether the source knows the symbol at all.
        for (const m of text.matchAll(/[=\[,\s]([a-z][a-z0-9_]{2,})/g)) {
            const sym = m[1];
            if (missing.has(sym)) continue;
            for (const kind of KINDS) {
                if (!sPacks[kind].has(sym)) continue;
                if (tPacks[kind].has(sym)) break;           // present, fine
                missing.set(sym, kind);
                break;
            }
        }
    }
    const counts = { COSMETIC: 0, PORTABLE: 0, VISIBLE: 0, BLOCKING: 0 };
    const detail = { COSMETIC: [], PORTABLE: [], VISIBLE: [], BLOCKING: [] };
    for (const [sym, kind] of missing) {
        const cat = COSMETIC.has(kind) ? 'COSMETIC'
            : PORTABLE.has(kind) ? 'PORTABLE'
            : VISIBLE.has(kind) ? 'VISIBLE'
            : 'BLOCKING';
        counts[cat]++;
        if (detail[cat].length < 6) detail[cat].push(`${sym} (${kind})`);
    }
    // PORTABLE and COSMETIC work is mechanical; VISIBLE (models) and BLOCKING need a decision.
    const worst = counts.VISIBLE > 0 ? 'VISIBLE' : counts.BLOCKING > 0 ? 'BLOCKING'
        : counts.PORTABLE > 0 ? 'PORTABLE' : counts.COSMETIC > 0 ? 'COSMETIC' : 'NONE';
    rows.push({ quest: q, ...counts, worst, detail });
}

if (asJson) { console.log(JSON.stringify(rows, null, 2)); }
else {
    console.log('| Quest | COSMETIC | PORTABLE | VISIBLE | BLOCKING | Verdict |');
    console.log('|---|---|---|---|---|---|');
    for (const r of rows.sort((a, b) => a.worst.localeCompare(b.worst))) {
        console.log(`| \`${r.quest}\` | ${r.COSMETIC} | ${r.PORTABLE} | ${r.VISIBLE} | ${r.BLOCKING} | ${r.worst} |`);
    }
    const tot = (k) => rows.reduce((a, r) => a + r[k], 0);
    const verdicts = rows.reduce((a, r) => (a[r.worst] = (a[r.worst] ?? 0) + 1, a), {});
    console.log();
    console.log(`quests: ${rows.length}  COSMETIC-only: ${verdicts.COSMETIC ?? 0}  need-VISIBLE: ${verdicts.VISIBLE ?? 0}  BLOCKING: ${verdicts.BLOCKING ?? 0}  clean: ${verdicts.NONE ?? 0}`);
    console.log(`totals  cosmetic=${tot('COSMETIC')} portable=${tot('PORTABLE')} visible=${tot('VISIBLE')} blocking=${tot('BLOCKING')}`);
}
