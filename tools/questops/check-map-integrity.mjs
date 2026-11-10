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

/** Return every numeric spawn, retaining positions so translated IDs can be checked against
 * their original source-map identities. A set of numeric IDs alone cannot do that. */
function parseMap(file) {
    const ids = { npc: new Set(), loc: new Set(), obj: new Set() };
    const entries = { npc: [], loc: [], obj: [] };
    const occurrences = new Map();
    let cur = null;
    for (const raw of readFileSync(file, 'utf8').split('\n')) {
        const line = raw.trim();
        if (line.startsWith('====')) {
            cur = Object.keys(SECTIONS).find((k) => line.includes(SECTIONS[k])) ?? null;
            continue;
        }
        if (!cur || !line) continue;
        const m = line.match(/^(-?\d+)\s+(-?\d+)\s+(-?\d+):\s*(-?\d+)(?:\s|$)/);
        if (!m) throw new Error(`Malformed ${cur} record in ${file}: ${line}`);
        const id = Number(m[4]);
        if (!Number.isSafeInteger(id) || id < 0) throw new Error(`Invalid ${cur} ID in ${file}: ${line}`);
        const pos = `${cur}:${m[1]},${m[2]},${m[3]}`;
        const sequence = occurrences.get(pos) ?? 0;
        occurrences.set(pos, sequence + 1);
        ids[cur].add(id); // ID 0 is valid (e.g. NPC 0 in Lumbridge)
        entries[cur].push({ id, key: `${pos}#${sequence}` });
    }
    return { ids, entries };
}

const rows = [];
let scannedMaps = 0;
let parsedRecords = 0;
const tmaps = join(target, 'maps');
const smaps = join(source, 'maps');
for (const f of readdirSync(tmaps).filter((n) => n.endsWith('.jm2'))) {
    if (onlyMap && basename(f, '.jm2') !== onlyMap.replace(/\.jm2$/, '')) continue;
    if (!existsSync(join(smaps, f))) continue; // only maps imported from the source
    scannedMaps++;
    const targetMap = parseMap(join(tmaps, f));
    const sourceMap = parseMap(join(smaps, f));
    const r = { map: basename(f, '.jm2'), dangling: { npc: [], loc: [], obj: [] }, mismatch: { npc: [], loc: [], obj: [] }, noDef: { npc: [], loc: [], obj: [] } };
    for (const kind of ['npc', 'loc', 'obj']) {
        parsedRecords += targetMap.entries[kind].length;
        const sourceAt = new Map(sourceMap.entries[kind].map(({ id, key }) => [key, id]));
        for (const { id, key } of targetMap.entries[kind]) {
            const tSym = packs[kind].t.get(id);
            const originalId = sourceAt.get(key);
            const expected = originalId === undefined ? packs[kind].s.get(id) : packs[kind].s.get(originalId);
            if (tSym === undefined) { r.dangling[kind].push(id); continue; }
            // After translating a colliding 377 ID, the new ID is absent from the 377 pack.
            // The original source spawn at the same position is the required identity.
            if (expected !== undefined && expected !== tSym) {
                r.mismatch[kind].push(`${id}:${expected}->${tSym} at ${key}`);
                continue;
            }
            if (!defs[kind].has(tSym)) r.noDef[kind].push(`${id}:${tSym}`);
        }
    }
    const bad = ['dangling', 'mismatch', 'noDef'].reduce((a, k) =>
        a + Object.values(r[k]).reduce((x, arr) => x + arr.length, 0), 0);
    if (bad > 0) rows.push(r);
}

if (scannedMaps === 0 || parsedRecords === 0) {
    console.error(`INCONCLUSIVE: scanned ${scannedMaps} map(s), parsed ${parsedRecords} spawn records; refusing a false clean result`);
    process.exit(2);
}
if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
} else {
    console.log(`scanned maps: ${scannedMaps}; parsed records: ${parsedRecords}`);
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
}
process.exitCode = rows.length ? 1 : 0;
