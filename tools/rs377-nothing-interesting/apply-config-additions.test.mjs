import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { plan, isActiveWorld } from './apply-config-additions.mjs';

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
