import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { patchText, inspectTarget } from './apply-tempinv-persist.mjs';

const fixture = [
    '[partyroom_dropinv]', 'size=216', 'scope=shared', '',
    '[partyroom_tempinv]', 'size=8', '',
    '[crafting_make_rings]', 'scope=temp', ''
].join('\n');

test('makes only the per-player party offer inventory persistent', () => {
    const out = patchText(fixture);
    assert.match(out, /\[partyroom_tempinv\]\nsize=8\nscope=perm/);
    assert.match(out, /\[partyroom_dropinv\]\nsize=216\nscope=shared/);
    assert.match(out, /\[crafting_make_rings\]\nscope=temp/);
    assert.throws(() => patchText(out), /already scope=perm/);
});

test('replaces an explicit temp scope and fails closed on size drift', () => {
    const explicit = fixture.replace('[partyroom_tempinv]\nsize=8', '[partyroom_tempinv]\nsize=8\nscope=temp');
    assert.match(patchText(explicit), /\[partyroom_tempinv\]\nsize=8\nscope=perm/);
    assert.throws(() => patchText(fixture.replace('[partyroom_tempinv]\nsize=8', '[partyroom_tempinv]\nsize=9')), /Unexpected/);
    assert.throws(() => patchText(fixture.replace('[partyroom_tempinv]', '[other]')), /Missing/);
});

test('dry run is read-only and active runtime paths are refused', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-partychest-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const clone = path.join(root, 'clone');
    const live = path.join(root, 'runtime', 'jparris-377', 'content');
    const file = path.join(clone, 'scripts', '_unpack', '727', 'all.inv');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.mkdirSync(live, { recursive: true });
    fs.writeFileSync(file, fixture);
    fs.writeFileSync(path.join(root, 'runtime', 'jparris-377', 'active.json'), JSON.stringify({ content: live }));

    assert.equal(inspectTarget(root, clone).dryRun, true);
    assert.equal(fs.readFileSync(file, 'utf8'), fixture);
    assert.throws(() => inspectTarget(root, live, true), /REFUSED/);
    assert.equal(inspectTarget(root, clone, true).dryRun, false);
    assert.equal(fs.readFileSync(file + '.joshrs-partychest.original', 'utf8'), fixture);
    assert.match(fs.readFileSync(file, 'utf8'), /\[partyroom_tempinv\]\nsize=8\nscope=perm/);
    assert.throws(() => inspectTarget(root, clone, true), /already scope=perm/);
});
