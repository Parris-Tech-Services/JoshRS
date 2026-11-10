// translate-map-ids.py must never touch a map it was not told to import.
//
// The bug this guards: judging imports by filename overlap with the source revision also matched
// native 274 maps that share a name with a 377 map, and rewriting those corrupts original areas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const script = new URL('../tools/questops/translate-map-ids.py', import.meta.url).pathname;

function world({ manifest = true, importedNpc = '5', nativeNpc = '5' } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'translate-'));
    const mk = (base, npcName) => {
        mkdirSync(join(base, 'maps'), { recursive: true });
        mkdirSync(join(base, 'pack'), { recursive: true });
        mkdirSync(join(base, 'scripts/_unpack/274'), { recursive: true });
        writeFileSync(join(base, 'pack/npc.pack'), '5=npc_five\n');
        writeFileSync(join(base, 'scripts/_unpack/274/all.npc'), '[npc_five]\nmodel1=x\n');
        writeFileSync(join(base, 'maps/shared.jm2'), `==== MAP ====\n0 0 0: 1\n==== NPC ====\n0 1 1: ${npcName}\n==== OBJ ====\n==== LOC ====\n`);
    };
    mk(join(root, 't'), importedNpc);
    mk(join(root, 's'), nativeNpc);
    mkdirSync(join(root, 'engine/data/config'), { recursive: true });
    writeFileSync(join(root, 'engine/data/config/world.json'), JSON.stringify({ engine: { revision: '274' } }));
    if (manifest) writeFileSync(join(root, 't/imported-maps.txt'), '# comment\nshared.jm2 deadbeef\n');
    return root;
}

test('refuses to run without a manifest', () => {
    const root = world({ manifest: false });
    let code = 0, out = '';
    try {
        out = execFileSync('python3', [script, join(root, 't'), join(root, 's'), '--dry-run'], { encoding: 'utf8' });
    } catch (e) { code = e.status ?? 1; out = String(e.stdout ?? '') + String(e.stderr ?? ''); }
    assert.equal(code, 2, out);
    assert.match(out, /BLOCKED/);
});

test('runs with a manifest and reports the manifest count', () => {
    const root = world();
    const out = execFileSync('python3', [script, join(root, 't'), join(root, 's'), '--dry-run'], { encoding: 'utf8' });
    assert.match(out, /manifest maps: 1/);
});
