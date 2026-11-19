import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installJournal, patchRadu } from './install-journal.mjs';

test('journal preserves original NPC logic, CRLF and idempotence; unknown source fails', () => {
    const original = '[opnpc1,burgh_vilager_3]\r\n@joshrs_peace_shirt_radu;\r\n';
    const patched = patchRadu(original);
    assert.ok(patched.endsWith('@joshrs_peace_shirt_radu;\r\n'));
    assert.equal(patchRadu(patched), patched);
    assert.throws(() => patchRadu('[opnpc1,other]\n'), /Unexpected/);
});
test('active world refused; dry-run is read-only; installation preserves exact rollback bytes', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-journal-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const content = path.join(root, 'content');
    const scripts = path.join(content, 'scripts/joshrs_original/scripts');
    fs.mkdirSync(scripts, { recursive: true });
    fs.writeFileSync(path.join(scripts, 'quest_peace_shirt.rs2'), 'base');
    const radu = path.join(scripts, 'burgh_vilager_3.rs2');
    const before = '[opnpc1,burgh_vilager_3]\n@joshrs_peace_shirt_radu;\n';
    fs.writeFileSync(radu, before);
    const launcherRoot = path.join(root, 'launcher');
    fs.mkdirSync(path.join(launcherRoot, 'runtime/jparris-377'), { recursive: true });
    fs.writeFileSync(path.join(launcherRoot, 'runtime/jparris-377/active.json'), JSON.stringify({ content }));
    assert.throws(() => installJournal(content, { launcherRoot, apply: true }), /active family/);
    const options = { launcherRoot: path.join(root, 'unused') };
    assert.equal(installJournal(content, options).files.length, 2);
    assert.equal(fs.readFileSync(radu, 'utf8'), before);
    assert.equal(fs.readdirSync(content).length, 1);
    const applied = installJournal(content, { ...options, apply: true });
    assert.equal(fs.readFileSync(path.join(applied.backup, '0'), 'utf8'), before);
    assert.equal(installJournal(content, { ...options, apply: true }).files.length, 0);
});
