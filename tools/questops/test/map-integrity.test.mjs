// Regression tests for check-map-integrity.mjs.
//
// These exist because its first version reported a clean bill of health while parsing nothing, and
// because two later bugs (id 0 dropped, --json always exiting 0) would each have hidden failures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const script = new URL('../check-map-integrity.mjs', import.meta.url).pathname;

/** Build a throwaway target/source pair with one map and the given packs. */
function fixture({ targetNpc = {}, sourceNpc = {}, mapNpc = [], mapId = 'x' } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'mapint-'));
    const mk = (base, packs, mapBody) => {
        mkdirSync(join(base, 'pack'), { recursive: true });
        mkdirSync(join(base, 'maps'), { recursive: true });
        mkdirSync(join(base, 'scripts/_unpack/r'), { recursive: true });
        for (const [id, name] of Object.entries(packs)) {
            writeFileSync(join(base, 'pack/npc.pack'), `${id}=${name}\n`, { flag: 'a' });
            writeFileSync(join(base, 'scripts/_unpack/r/all.npc'), `[${name}]\n`, { flag: 'a' });
        }
        writeFileSync(join(base, 'maps', `${mapId}.jm2`), mapBody ?? '');
    };
    const mapBody = ['==== MAP ====', '0 0 0: 1', '==== NPC ====', ...mapNpc.map((i) => `0 1 1: ${i}`), '==== OBJ ====', '==== LOC ====', ''].join('\n');
    mk(join(root, 't'), targetNpc, mapBody);
    mk(join(root, 's'), sourceNpc, mapBody);
    return root;
}

function run(root) {
    try {
        const out = execFileSync('node', [script, join(root, 't'), join(root, 's')], { encoding: 'utf8' });
        return { code: 0, out };
    } catch (e) {
        return { code: e.status ?? 1, out: (e.stdout ?? '') + (e.stderr ?? '') };
    }
}

test('a resolving reference reports no problems and exits 0', () => {
    const root = fixture({ targetNpc: { 5: 'goblin' }, sourceNpc: { 5: 'goblin' }, mapNpc: [5] });
    const r = run(root);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /maps with problems: 0/);
});

test('a dangling reference is reported and exits non-zero', () => {
    const root = fixture({ targetNpc: { 5: 'goblin' }, sourceNpc: { 5: 'goblin', 9: 'rat' }, mapNpc: [9] });
    const r = run(root);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /dangling=1/);
});

test('a mismatched identity is reported', () => {
    const root = fixture({ targetNpc: { 5: 'goblin' }, sourceNpc: { 5: 'rat' }, mapNpc: [5] });
    const r = run(root);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /mismatch=1/);
});

test('id 0 is treated as a real reference, not skipped', () => {
    const root = fixture({ targetNpc: { 1: 'x' }, sourceNpc: { 1: 'x', 0: 'ghost' }, mapNpc: [0] });
    const r = run(root);
    // 0 is registered in the source but not the target: it must be reported, not ignored.
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /dangling=1/);
});

test('--json exits non-zero when problems exist', () => {
    const root = fixture({ targetNpc: {}, sourceNpc: { 9: 'rat' }, mapNpc: [9] });
    let code = 0;
    try {
        execFileSync('node', [script, join(root, 't'), join(root, 's'), '--json'], { encoding: 'utf8' });
    } catch (e) {
        code = e.status ?? 1;
    }
    assert.equal(code, 1);
});
