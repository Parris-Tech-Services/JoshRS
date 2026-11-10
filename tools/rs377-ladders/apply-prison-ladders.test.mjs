import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { patchText, inspectTarget } from './apply-prison-ladders.mjs';

const fixture = [
    '[oploc1,loc_11728]', 'p_arrivedelay;',
    '[label,ladder_options]', 'if_close;',
    '[proc,climb_ladder]', 'p_telejump($coord);', ''
].join('\n');
const pack = '9558=prison_ladder_up\n9559=prison_laddertop\n';

test('adds three verified prison ladder pairs with loc-tile destinations', () => {
    const out = patchText(fixture, pack);
    assert.match(out, /\[oploc1,prison_ladder_up\]\np_arrivedelay;\nswitch_coord \(loc_coord\) \{/);
    assert.match(out, /case 0_45_51_35_59 : ~climb_ladder\(movecoord\(loc_coord, 0, 1, 0\), true\);/);
    assert.match(out, /case 1_45_51_35_59 : ~climb_ladder\(movecoord\(loc_coord, 0, -1, 0\), false\);/);
    assert.match(out, /case 0_47_49_2_48 :/);
    assert.match(out, /case 1_47_49_2_48 :/);
    assert.throws(() => patchText(out, pack), /already present/);
});

test('fails closed on loc mapping or helper drift', () => {
    assert.throws(() => patchText(fixture, '9558=other\n9559=prison_laddertop\n'), /Unexpected loc mapping/);
    assert.throws(() => patchText(fixture.replace('[proc,climb_ladder]', 'missing'), pack), /Missing upstream/);
});

test('dry run is read-only and active runtime paths are refused', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-prison-ladder-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const clone = path.join(root, 'clone');
    const live = path.join(root, 'runtime', 'jparris-377', 'content');
    const file = path.join(clone, 'scripts', 'ladders+stairs', 'scripts', 'ladders.rs2');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.mkdirSync(path.join(clone, 'pack'), { recursive: true });
    fs.mkdirSync(live, { recursive: true });
    fs.writeFileSync(file, fixture);
    fs.writeFileSync(path.join(clone, 'pack', 'loc.pack'), pack);
    fs.writeFileSync(path.join(root, 'runtime', 'jparris-377', 'active.json'), JSON.stringify({ content: live }));

    assert.equal(inspectTarget(root, clone).dryRun, true);
    assert.equal(fs.readFileSync(file, 'utf8'), fixture);
    assert.throws(() => inspectTarget(root, live, true), /REFUSED/);
    assert.equal(inspectTarget(root, clone, true).dryRun, false);
    assert.equal(fs.readFileSync(file + '.joshrs-prison-ladder.original', 'utf8'), fixture);
    assert.match(fs.readFileSync(file, 'utf8'), /\[oploc1,prison_ladder_up\]/);
    assert.throws(() => inspectTarget(root, clone, true), /already present/);
});
