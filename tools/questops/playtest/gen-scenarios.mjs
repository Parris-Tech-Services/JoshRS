#!/usr/bin/env node
// Writes a starting scenario (layer 1) and client checkpoints (layer 3) for each quest, from content:
//   - the stage variable, from [proc,count_questpoints] / ^..._complete checks (dev-debug/inspect.mjs)
//   - the NPCs the quest has Talk-to handlers for ([opnpc1,<npc>])
//   - where those NPCs stand, from the NPC section of the maps
// The result is a scaffold: it proves the NPC is in place, talks, and that the stage variable survives
// save/reload. Add the real dialogue choices from `run.ts --dump` to take it further.
//
// Usage: gen-scenarios.mjs <content> --out <dir> [--quest quest_x ...] [--checkpoints file.json] [--force]
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMap, loadPack, stageDefinition } from '../dev-debug/inspect.mjs';

function* walk(dir, ext) {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) yield* walk(p, ext);
        else if (e.name.endsWith(ext)) yield p;
    }
}

/** npc name -> [{ x, z, level }] from every map's NPC section. */
export function npcSpawns(content) {
    const names = loadPack(join(content, 'pack/npc.pack')).byId;
    const out = new Map();
    for (const f of readdirSync(join(content, 'maps')).filter((n) => /^m\d+_\d+\.jm2$/.test(n))) {
        const [, mx, mz] = f.match(/^m(\d+)_(\d+)/).map(Number);
        for (const r of parseMap(readFileSync(join(content, 'maps', f), 'utf8')).NPC) {
            const name = names.get(r.id);
            if (!name) continue;
            if (!out.has(name)) out.set(name, []);
            out.get(name).push({ x: mx * 64 + r.localX, z: mz * 64 + r.localZ, level: r.level });
        }
    }
    return out;
}

/** Talk-to NPCs of a quest, in script order, with the text of each handler. */
export function talkNpcs(questDir) {
    const out = [];
    for (const f of [...walk(join(questDir, 'scripts'), '.rs2')].sort()) {
        const parts = readFileSync(f, 'utf8').split(/^(?=\[[a-z0-9_]+,[^\]]+\])/m);
        for (const p of parts) { const h = p.match(/^\[opnpc1,([^\]_][^\]]*)\]/); if (h && !out.some((o) => o.npc === h[1])) out.push({ npc: h[1], body: p }); }
    }
    return out;
}

export function buildScenario(content, quest, spawns) {
    const stage = stageDefinition(content, quest);
    const npcs = talkNpcs(join(content, 'scripts/quests', quest));
    const placed = npcs.filter((n) => spawns.has(n.npc));
    // The start NPC is the one whose handler deals with "not started" (stage 0); otherwise the first placed.
    const sv = stage.stageVar;
    const start = (sv && placed.find((n) => new RegExp(`%${sv}\\s*=\\s*(0\\b|\\^[a-z0-9_]*not_started)`).test(n.body))) ?? placed[0] ?? null;
    const steps = [], notes = [];
    if (start) {
        const s = spawns.get(start.npc)[0];
        steps.push({ do: 'teleport', x: s.x, z: s.z, level: s.level }, { do: 'expectNpcNear', npc: start.npc, radius: 8 }, { do: 'talk', npc: start.npc }, { do: 'dump' });
    } else notes.push(npcs.length ? `none of its Talk-to NPCs (${npcs.map((n) => n.npc).join(', ')}) has a map spawn: placed by script, or missing from the maps` : 'no [opnpc1,...] handler found: the quest starts another way');
    if (sv && stage.variable?.type === 'varp') steps.push({ do: 'expectPerm', varp: sv }, { do: 'setVar', varp: sv, value: 1 }, { do: 'saveReload' }, { do: 'expectVar', varp: sv, value: 1 });
    else notes.push(sv ? `stage var ${sv} is a ${stage.variable?.type ?? 'unknown'}; the harness sets varps by name, so the save/reload steps are left out` : `stage var not identified (${stage.status})`);
    const checkpoints = placed.map((n) => ({ name: `${quest}: ${n.npc}`, ...spawns.get(n.npc)[0] }));
    return { scenario: { name: `${quest}: start NPC in place, talks, stage survives save/reload`, generated: true, notes: notes.join('; ') || undefined, steps }, checkpoints, start: start?.npc ?? null, stageVar: sv ?? null };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const args = process.argv.slice(2);
    const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
    const content = args.find((a, i) => !a.startsWith('--') && !['--out', '--quest', '--checkpoints'].includes(args[i - 1]));
    const out = opt('--out');
    if (!content || !out) { console.error('usage: gen-scenarios.mjs <content> --out <dir> [--quest quest_x ...] [--checkpoints file.json] [--force]'); process.exit(2); }
    const wanted = args.flatMap((a, i) => (args[i - 1] === '--quest' ? [a] : []));
    const qdir = join(content, 'scripts/quests');
    const quests = wanted.length ? wanted : readdirSync(qdir).filter((n) => /^quest_[a-z0-9_]+$/.test(n) && statSync(join(qdir, n)).isDirectory()).sort();
    const spawns = npcSpawns(content);
    mkdirSync(out, { recursive: true });
    const allCheckpoints = [];
    for (const q of quests) {
        if (!existsSync(join(qdir, q))) { console.log(`SKIP ${q}: no such quest directory`); continue; }
        const r = buildScenario(content, q, spawns);
        allCheckpoints.push(...r.checkpoints);
        const file = join(out, `${q}-start.json`);
        if (existsSync(file) && !args.includes('--force') && !JSON.parse(readFileSync(file, 'utf8')).generated) { console.log(`KEEP ${file}: edited by hand (no "generated": true)`); continue; }
        if (!r.scenario.steps.length) { console.log(`NONE ${q}: ${r.scenario.notes}`); continue; }
        writeFileSync(file, JSON.stringify(r.scenario, null, 2) + '\n');
        console.log(`WROTE ${file}  start=${r.start ?? '-'}  stage=${r.stageVar ?? '-'}${r.scenario.notes ? `  (${r.scenario.notes})` : ''}`);
    }
    const cp = opt('--checkpoints');
    if (cp) { writeFileSync(cp, JSON.stringify({ notes: 'Generated by gen-scenarios.mjs: one checkpoint per placed quest NPC.', checkpoints: allCheckpoints }, null, 2) + '\n'); console.log(`WROTE ${cp}: ${allCheckpoints.length} checkpoint(s)`); }
}
