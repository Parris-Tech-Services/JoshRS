#!/usr/bin/env node
// One-off bootstrap of <target>/imported-maps.txt for a world whose maps were restored before
// restore-maps.sh kept a manifest.
//
// A map counts as imported when it is in the target but NOT in a pristine copy of the 274 map set
// (--baseline). Name matching against the 377 set cannot tell these apart: 274's own maps share names
// with 377 maps.
//
// Usage: record-imported-maps.mjs <target-content> <source-content> --baseline <pristine-274-maps-dir> [--dry-run]
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { MANIFEST } from './lib/rs-refs.mjs';

const args = process.argv.slice(2);
const [target, source] = args;
const bi = args.indexOf('--baseline');
const baseline = bi >= 0 ? args[bi + 1] : null;
if (!target || !source || !baseline) {
    console.error('usage: record-imported-maps.mjs <target-content> <source-content> --baseline <pristine-274-maps-dir> [--dry-run]');
    process.exit(2);
}
if (!existsSync(baseline)) { console.error(`BLOCKED: baseline ${baseline} does not exist`); process.exit(2); }

const jm2 = (d) => new Set(readdirSync(d).filter((n) => n.endsWith('.jm2')));
const native = jm2(baseline), tmaps = jm2(join(target, 'maps')), smaps = jm2(join(source, 'maps'));
if (native.size === 0) { console.error('BLOCKED: baseline has no .jm2 files'); process.exit(2); }

const imported = [...tmaps].filter((n) => !native.has(n) && smaps.has(n)).sort();
const unknown = [...tmaps].filter((n) => !native.has(n) && !smaps.has(n));
const lines = imported.map((n) => `${n} ${createHash('sha256').update(readFileSync(join(source, 'maps', n))).digest('hex')}`);

console.log(`native 274: ${native.size}  target: ${tmaps.size}  imported from source: ${imported.length}`);
if (unknown.length) console.log(`WARNING: ${unknown.length} target maps are in neither set: ${unknown.slice(0, 5).join(' ')}`);
if (args.includes('--dry-run')) { console.log(lines.slice(0, 5).join('\n')); process.exit(0); }
writeFileSync(join(target, MANIFEST), `# maps imported from ${source} (sha256 of the source file)\n${lines.join('\n')}\n`);
console.log(`wrote ${join(target, MANIFEST)}`);
