import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { patchText, inspectTarget } from './apply-falador-vertical.mjs';

const fixture = [
    '',
    '[oploc1,loc_11727]', 'p_arrivedelay;',
    '~climb_ladder(movecoord(coord(), 0, 1, 0), true);',
    '[oploc1,loc_11728]', 'p_arrivedelay;',
    '~climb_ladder(movecoord(coord(), 0, -1, 0), false);',
    '[label,ladder_options]', 'if_close;',
    '[proc,climb_ladder]', 'p_telejump($coord);', ''
].join('\n');
const pack = [11739, 11740, 11741, 11742].map(id => `${id}=loc_${id}`).join('\n') + '\n';

test('adds matching up/down handlers for the real Falador ladder pair', () => {
    const out = patchText(fixture, pack);
    assert.equal((out.match(/\[oploc1,loc_11739\]/g) || []).length, 1);
    assert.match(out, /\[oploc1,loc_11739\]\np_arrivedelay;\n~climb_ladder\(movecoord\(coord\(\), 0, 1, 0\), true\)/);
    assert.match(out, /\[oploc1,loc_11740\]\np_arrivedelay;\n~climb_ladder\(movecoord\(coord\(\), 0, 1, 0\), true\)/);
    assert.match(out, /\[oploc1,loc_11741\]\np_arrivedelay;\n~climb_ladder\(movecoord\(coord\(\), 0, -1, 0\), false\)/);
    assert.match(out, /\[oploc1,loc_11742\]\np_arrivedelay;\n~climb_ladder\(movecoord\(coord\(\), 0, -1, 0\), false\)/);
    assert.throws(() => patchText(out, pack), /already have handlers/);
});

test('fails closed on content drift or an unexpected loc mapping', () => {
    assert.throws(() => patchText(fixture, pack.replace('11742=loc_11742', '11742=other')), /Unexpected loc mapping/);
    assert.throws(() => patchText(fixture.replace('[oploc1,loc_11727]', 'missing'), pack), /Source drift/);
    assert.throws(() => patchText(fixture.replace('[proc,climb_ladder]', 'missing'), pack), /Missing upstream/);
});

test('dry run is read-only and active runtime paths are refused', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-falador-ladder-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const clone = path.join(root, 'clone');
    const live = path.join(root, 'runtime', 'jparris-377', 'content');
    const source = path.join(clone, 'scripts', 'ladders+stairs', 'scripts', 'ladders.rs2');
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.mkdirSync(path.join(clone, 'pack'), { recursive: true });
    fs.mkdirSync(live, { recursive: true });
    fs.writeFileSync(source, fixture);
    fs.writeFileSync(path.join(clone, 'pack', 'loc.pack'), pack);
    fs.writeFileSync(path.join(root, 'runtime', 'jparris-377', 'active.json'), JSON.stringify({ content: live }));

    assert.equal(inspectTarget(root, clone).dryRun, true);
    assert.equal(fs.readFileSync(source, 'utf8'), fixture);
    assert.throws(() => inspectTarget(root, live, true), /REFUSED/);

    assert.equal(inspectTarget(root, clone, true).dryRun, false);
    assert.equal(fs.readFileSync(source + '.joshrs-falador-ladder.original', 'utf8'), fixture);
    assert.match(fs.readFileSync(source, 'utf8'), /\[oploc1,loc_11739\]/);
    assert.throws(() => inspectTarget(root, clone, true), /already have handlers/);
});
