import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { patchVarp, patchQuestPoints, install } from './install.mjs';

const varp = '[varp_722]\n\n[swansong_quest]\ntransmit=yes\n\n[varp_724]\n\n[other]\nscope=perm\n';
const quests = '[proc,count_questpoints]()(int)\ndef_int $questpoints = 0;\nif (%cookquest = ^cook_complete) {\n    $questpoints = add($questpoints, ^cook_questpoints);\n}\nreturn ($questpoints);\n\n[proc,update_questlist]\n';

test('makes varp_724 saved without touching other varps, idempotently', () => {
    const a = patchVarp(varp);
    assert.equal(a.changed, true);
    assert.match(a.text, /\[varp_724\]\nscope=perm\n/);
    assert.match(a.text, /\[swansong_quest\]\ntransmit=yes\n/);
    assert.equal(patchVarp(a.text).changed, false);
});

test('refuses if varp_724 already has properties or is missing', () => {
    assert.throws(() => patchVarp(varp.replace('[varp_724]\n', '[varp_724]\ntransmit=yes\n')), /already has properties/);
    assert.throws(() => patchVarp('[x]\n'), /not found/);
});

test('adds exactly one quest point before the recount returns, idempotently', () => {
    const a = patchQuestPoints(quests);
    assert.equal(a.changed, true);
    assert.match(a.text, /if \(%varp_724 >= 6\) \{\n    \$questpoints = add\(\$questpoints, 1\);\n\}\nreturn \(\$questpoints\);/);
    assert.equal(patchQuestPoints(a.text).changed, false);
    assert.throws(() => patchQuestPoints('[proc,other]\n'), /not found/);
});

test('dry run changes nothing; apply installs and backs up; active world is refused', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'peace-shirt-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const content = path.join(root, 'content');
    fs.mkdirSync(path.join(content, 'scripts', '_unpack', '377'), { recursive: true });
    fs.mkdirSync(path.join(content, 'scripts', 'general', 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(content, 'scripts', '_unpack', '377', 'all.varp'), varp);
    fs.writeFileSync(path.join(content, 'scripts', 'general', 'scripts', 'quests.rs2'), quests);
    const launcher = path.join(root, 'launcher');
    fs.mkdirSync(path.join(launcher, 'runtime', 'jparris-377'), { recursive: true });
    fs.writeFileSync(path.join(launcher, 'runtime', 'jparris-377', 'active.json'), JSON.stringify({ content }));

    assert.throws(() => install(content, { launcherRoot: launcher }), /REFUSED/);
    const dry = install(content, { allowActive: true, launcherRoot: launcher });
    assert.equal(dry.dryRun, true);
    assert.equal(fs.readFileSync(path.join(content, 'scripts', '_unpack', '377', 'all.varp'), 'utf8'), varp);

    const done = install(content, { apply: true, allowActive: true, launcherRoot: launcher });
    assert.equal(done.varpScopePerm, true);
    assert.equal(done.questPoint, true);
    assert.ok(fs.existsSync(path.join(content, 'scripts', 'joshrs_original', 'scripts', 'quest_peace_shirt.rs2')));
    assert.ok(fs.readdirSync(path.join(content, 'scripts', '_unpack', '377')).some(f => f.endsWith('.bak')));
    const again = install(content, { apply: true, allowActive: true, launcherRoot: launcher });
    assert.equal(again.varpScopePerm, false);
    assert.equal(again.questPoint, false);
});
