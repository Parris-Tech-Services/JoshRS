#!/usr/bin/env node
// Referential integrity for imported maps.
//
// An imported revision-377 map carries *numeric* NPC/LOC/OBJ ids. Those ids are only meaningful if
// the target registries resolve them to the same symbols the map was authored against. Two failures
// are possible and both are silent at runtime:
//
//   dangling  - the id is not registered at all, so the entity does not exist
//   mismatch  - the id is registered, but to a *different* symbol than the source intended
//
// The second is worse: it spawns a plausible, wrong NPC. This checks both, using the source
// revision's packs as the authority for what each id means.
//
// Usage: check-map-integrity.mjs <target-content> <source-content> [--json] [--map m54_48]
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const [target, source] = process.argv.slice(2);
if (!target || !source) {
    console.error('usage: check-map-integrity.mjs <target-content> <source-content> [--json] [--map name]');
    process.exit(2);
}
const asJson = process.argv.includes('--json');
const onlyMap = process.argv.includes('--map') ? process.argv[process.argv.indexOf('--map') + 1] : null;

function loadPack(file) {
    const m = new Map();
    if (!existsSync(file)) return m;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
        const parts = line.split('=');
        if (parts.length >= 2 && parts[0].trim().match(/^\d+$/)) m.set(Number(parts[0]), parts[1].trim());
    }
    return m;
}

const packs = {};
for (const kind of ['npc', 'loc', 'obj']) {
    packs[kind] = { t: loadPack(join(target, `pack/${kind}.pack`)), s: loadPack(join(source, `pack/${kind}.pack`)) };
}

// A pack entry is only usable if the definition exists too (all.npc / all.loc / all.obj).
const defs = {};
// Definitions live both in `_unpack/<rev>/all.<kind>` and in per-quest config files, so index the
// whole scripts tree. Reading only the unpack files reported thousands of false "no definition".
for (const kind of ['npc', 'loc', 'obj']) {
    const names = new Set();
    const walk = (dir) => {
        if (!existsSync(dir)) return;
        for (const e of readdirSync(dir, { withFileTypes: true })) {
            const p = join(dir, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith(`.${kind}`)) {
                for (const m of readFileSync(p, 'utf8').matchAll(/^\[([^\]\n]+)\]/gim)) names.add(m[1]);
            }
        }
    };
    walk(join(target, 'scripts'));
    defs[kind] = names;
}

const SECTIONS = { npc: 'NPC', loc: 'LOC', obj: 'OBJ' };

/** Parse a .jm2 into { npc: Set<id>, loc: Set<id>, obj: Set<id> }. */
function parseMap(file) {
    const out = { npc: new Set(), loc: new Set(), obj: new Set() };
    let cur = null;
    for (const raw of readFileSync(file, 'utf8').split('\n')) {
        const line = raw.trim();
        if (line.startsWith('====')) {
            cur = Object.keys(SECTIONS).find((k) => line.includes(SECTIONS[k])) ?? null;
            continue;
        }
        if (!cur || !line) continue;
        // Map records are "level x y: id" - the id follows a colon. An earlier pattern treated the
        // positional numbers as the id, matched nothing, and reported a clean bill of health.
        const m = line.match(/^-?\d+\s+-?\d+\s+-?\d+:\s*(-?\d+)/);
        if (!m) continue;
        const id = Number(m[1]);
        // 0 is a valid id in .jm2 records; filtering it silently dropped real references.
        if (Number.isFinite(id)) out[cur].add(id);
    }
    return out;
}

const rows = [];
const tmaps = join(target, 'maps');
const smaps = join(source, 'maps');
for (const f of readdirSync(tmaps).filter((n) => n.endsWith('.jm2'))) {
    if (onlyMap && !f.includes(onlyMap)) continue;
    if (!existsSync(join(smaps, f))) continue; // only maps imported from the source
    const refs = parseMap(join(tmaps, f));
    const r = { map: basename(f, '.jm2'), dangling: { npc: [], loc: [], obj: [] }, mismatch: { npc: [], loc: [], obj: [] }, noDef: { npc: [], loc: [], obj: [] } };
    for (const kind of ['npc', 'loc', 'obj']) {
        for (const id of refs[kind]) {
            const tSym = packs[kind].t.get(id);
            const sSym = packs[kind].s.get(id);
            if (tSym === undefined) { r.dangling[kind].push(id); continue; }
            if (sSym !== undefined && sSym !== tSym) { r.mismatch[kind].push(`${id}:${sSym}->${tSym}`); continue; }
            if (!defs[kind].has(tSym)) r.noDef[kind].push(`${id}:${tSym}`);
        }
    }
    const bad = ['dangling', 'mismatch', 'noDef'].reduce((a, k) =>
        a + Object.values(r[k]).reduce((x, arr) => x + arr.length, 0), 0);
    if (bad > 0) rows.push(r);
}

if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    // A machine-readable report that always exits 0 cannot gate anything.
    process.exitCode = rows.length ? 1 : 0;
} else {
    const total = (k1, k2) => rows.reduce((a, r) => a + r[k1][k2].length, 0);
    console.log(`maps with problems: ${rows.length}`);
    for (const kind of ['npc', 'loc', 'obj']) {
        console.log(`  ${kind}: dangling=${total('dangling', kind)} mismatch=${total('mismatch', kind)} noDefinition=${total('noDef', kind)}`);
    }
    const worst = rows.sort((a, b) =>
        Object.values(b.dangling).flat().length + Object.values(b.mismatch).flat().length -
        (Object.values(a.dangling).flat().length + Object.values(a.mismatch).flat().length)).slice(0, 5);
    console.log('\nworst maps:');
    for (const r of worst) {
        const d = Object.entries(r.dangling).filter(([, v]) => v.length).map(([k, v]) => `${k}:${v.length}`);
        const m = Object.entries(r.mismatch).filter(([, v]) => v.length).map(([k, v]) => `${k}:${v.length}`);
        console.log(`  ${r.map}  dangling[${d.join(',') || '-'}] mismatch[${m.join(',') || '-'}]`);
        if (r.mismatch.npc.length) console.log(`     npc mismatches: ${r.mismatch.npc.slice(0, 3).join(' ')}`);
    }
    process.exitCode = rows.length ? 1 : 0;
}
