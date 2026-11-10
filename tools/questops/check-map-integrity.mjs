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
// Only maps listed in <target>/imported-maps.txt are checked: native 274 maps share names with 377
// maps and are not described by the 377 packs. --all-shared-names restores the old, noisy behaviour.
//
// Usage: check-map-integrity.mjs <target-content> <source-content> [--json] [--map m54_48] [--all-shared-names]
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { loadPack, indexDefs, parseMapRefs, parseManifest, MANIFEST } from './lib/rs-refs.mjs';

const [target, source] = process.argv.slice(2);
if (!target || !source) {
    console.error('usage: check-map-integrity.mjs <target-content> <source-content> [--json] [--map name]');
    process.exit(2);
}
const asJson = process.argv.includes('--json');
const onlyMap = process.argv.includes('--map') ? process.argv[process.argv.indexOf('--map') + 1] : null;

const packs = {};
for (const kind of ['npc', 'loc', 'obj']) {
    packs[kind] = { t: loadPack(join(target, `pack/${kind}.pack`)), s: loadPack(join(source, `pack/${kind}.pack`)) };
}

// A pack entry is only usable if a definition exists, in all.<kind> or a per-quest config file.
const defs = {};
for (const kind of ['npc', 'loc', 'obj']) defs[kind] = indexDefs(join(target, 'scripts'), kind);

const parseMap = (file) => parseMapRefs(readFileSync(file, 'utf8'));

const manifestFile = join(target, MANIFEST);
const allShared = process.argv.includes('--all-shared-names');
if (!allShared && !existsSync(manifestFile)) {
    console.error(`BLOCKED: ${manifestFile} not found. Run record-imported-maps.mjs (or restore-maps.sh) first,`);
    console.error('or pass --all-shared-names to check every map that shares a name with the source (includes native maps).');
    process.exit(2);
}
const imported = allShared ? null : parseManifest(readFileSync(manifestFile, 'utf8'));

const rows = [];
const tmaps = join(target, 'maps');
const smaps = join(source, 'maps');
// Only maps that were actually imported can be judged against the source revision. An original 274
// map that merely shares a filename with a 377 map is not an import and would produce false reports.
const manifestPath = join(tmaps, 'imported-from-377.json');
let importedSet = null;
if (existsSync(manifestPath)) {
    importedSet = new Set(Object.keys(JSON.parse(readFileSync(manifestPath, 'utf8'))));
} else {
    console.log('NOTE: no maps/imported-from-377.json; falling back to filename overlap (can produce false mismatches)');
}

for (const f of readdirSync(tmaps).filter((n) => n.endsWith('.jm2'))) {
    if (onlyMap && !f.includes(onlyMap)) continue;
<<<<<<< HEAD
    if (imported ? !imported.has(f) : !existsSync(join(smaps, f))) continue;
=======
    if (importedSet ? !importedSet.has(f) : !existsSync(join(smaps, f))) continue;
>>>>>>> origin/main
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

// Problems fail the run in both output modes; --json used to exit 0 whatever it found.
process.exitCode = rows.length ? 1 : 0;
if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
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
}
