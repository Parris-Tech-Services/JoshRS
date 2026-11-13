import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { plan, planReplace, isActiveWorld } from './apply-config-additions.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'expansions', 'rs377-fixes', 'config', 'nih_fishing_spots.json'), 'utf8'));

const fixture = Object.keys(spec.add).map(n => `[${n}]\nname=Fishing spot\nop1=Net\nop3=Bait\n`).join('\n') + '\n[other]\nname=x\n';

test('adds category and whirlpool param to every spot, and is idempotent', () => {
    const a = plan(fixture, spec.add);
    assert.equal(a.changes.length, Object.keys(spec.add).length * 2);
    for (const n of Object.keys(spec.add)) assert.match(a.text, new RegExp(`\\[${n}\\][^\\[]*category=`));
    assert.equal(plan(a.text, spec.add).changes.length, 0);
    assert.match(a.text, /\[other\]\nname=x/);
});

test('refuses a block that already has a different category', () => {
    const n = Object.keys(spec.add)[0];
    assert.throws(() => plan(`[${n}]\ncategory=somethingelse\n`, { [n]: spec.add[n] }), /different category/);
});

test('refuses missing blocks', () => {
    assert.throws(() => plan('[nope]\n', spec.add), /not found/);
});

test('treats the live world as active in every path spelling', () => {
    const parts = ['C:', 'JoshRS-Launcher', 'JoshRS-main', 'runtime', 'jparris-377', 'usb-x', 'content'];
    const back = String.fromCharCode(92);
    for (const p of [parts.join(back), parts.join('/'), parts.join(back).toLowerCase().replace('runtime', 'RUNTIME')])
        assert.equal(isActiveWorld(p), true, p);
    assert.equal(isActiveWorld(path.join(os.tmpdir(), 'iso377', 'content')), false);
});

test('CLI refuses the live world even for a dry run', () => {
    const live = path.join(os.tmpdir(), 'nihguard', 'runtime', 'jparris-377', 'usb', 'content');
    fs.mkdirSync(path.join(live, 'scripts'), { recursive: true });
    const s = path.join(os.tmpdir(), 'nihguard', 'spec.json');
    fs.writeFileSync(s, JSON.stringify(spec));
    for (const extra of [[], ['--apply']])
        assert.throws(() => execFileSync(process.execPath, [path.join(here, 'apply-config-additions.mjs'), '--content', live, '--spec', s, ...extra], { stdio: 'pipe' }), /REFUSED/);
});

test('exact replacements apply once, are idempotent, and refuse ambiguity', () => {
    const NL = String.fromCharCode(10);
    const src = ['anim(%com_attackanim, 0);', 'sound_synth(%com_attacksound, 0, 0);', '.sound_synth(%com_attacksound, 0, 0);', ''].join(NL);
    const pairs = [
        [NL + 'sound_synth(%com_attacksound, 0, 0);', NL + 'if (%com_attacksound ! null) sound_synth(%com_attacksound, 0, 0);'],
        [NL + '.sound_synth(%com_attacksound, 0, 0);', NL + 'if (%com_attacksound ! null) .sound_synth(%com_attacksound, 0, 0);']
    ];
    const a = planReplace(src, pairs);
    assert.equal(a.changes.length, 2);
    assert.equal(a.text.split('! null').length - 1, 2);
    assert.equal(planReplace(a.text, pairs).changes.length, 0);
    assert.throws(() => planReplace('x' + NL + 'x', [['x', 'y']]), /exactly one/);
});

test('every shipped spec targets real files and has the expected shape', () => {
    const dir = path.join(here, '..', '..', 'expansions', 'rs377-fixes', 'config');
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
        const s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        const parts = Array.isArray(s.files) ? s.files : [s];
        assert.ok(parts.length > 0, f);
        for (const p of parts) {
            assert.match(p.file, /^scripts\//, f);
            assert.ok(p.add || p.replace, f);
            for (const lines of Object.values(p.add || {})) for (const l of lines) assert.match(l, /^(category|param|data)=/, `${f}: ${l}`);
        }
    }
});
