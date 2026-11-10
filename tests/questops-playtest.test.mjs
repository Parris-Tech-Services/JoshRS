// Pure parts of the playtest harness and the quest-points check. The engine-driving half (harness.ts)
// needs a packed dev world and is run on the phone, not in CI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateScenario, pickOption } from '../tools/questops/playtest/scenario.mjs';
import { procBody, completeChecks, varpScopes, varbitBases } from '../tools/questops/lib/rs-refs.mjs';
import { readFileSync, readdirSync } from 'node:fs';

test('bundled scenarios are well-formed', () => {
    const dir = 'tools/questops/playtest/scenarios';
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
        assert.deepEqual(validateScenario(JSON.parse(readFileSync(join(dir, f), 'utf8'))), [], f);
    }
});

test('scenario validation names the bad step', () => {
    assert.deepEqual(validateScenario({ name: 'x', steps: [{ do: 'talk' }, { do: 'fly' }] }),
        ['step 1 (talk): missing npc', 'step 2: unknown do "fly"']);
});

test('pickOption matches visible text, strips colour tags, and reports ambiguity', () => {
    const texts = new Map([[10, '<col=0000ff>I want to help.</col>'], [11, 'No thanks.'], [12, 'I want to leave.']]);
    assert.deepEqual(pickOption([10, 11, 12], texts, 'help'), { com: 10 });
    assert.equal(pickOption([10, 11, 12], texts, 'i want').error, '"i want" is ambiguous');
    assert.deepEqual(pickOption([10, 11, 12], texts, 'dance').options, ['I want to help.', 'No thanks.', 'I want to leave.']);
});

test('procBody stops at the next script header', () => {
    const t = '[proc,a]\n%x = 1;\n[proc,count_questpoints]()(int)\nif (%cookquest = ^cook_complete) {}\n[proc,b]\n%y = ^y_complete;\n';
    assert.deepEqual(completeChecks(procBody(t, 'count_questpoints')), [{ varp: 'cookquest', constant: 'cook_complete' }]);
});

test('varp scopes and varbit bases', () => {
    assert.deepEqual([...varpScopes('[a]\nscope=perm\n[b]\ntransmit=yes\n')], [['a', 'perm'], ['b', 'temp']]);
    assert.deepEqual([...varbitBases('[horrorquest]\nbasevar=deephorror\nstartbit=0\n')], [['horrorquest', 'deephorror']]);
});

function world(files) {
    const dir = mkdtempSync(join(tmpdir(), 'qp-'));
    for (const [p, text] of Object.entries(files)) { mkdirSync(join(dir, p, '..'), { recursive: true }); writeFileSync(join(dir, p), text); }
    return spawnSync(process.execPath, ['tools/questops/check-quest-points.mjs', dir], { encoding: 'utf8' });
}
const base = {
    'scripts/general/scripts/quests.rs2': '[proc,count_questpoints]()(int)\nif (%cookquest = ^cook_complete) {}\n[proc,other]\n',
    'scripts/quests/quest_cook/scripts/cook.rs2': 'if (%cookquest = ^cook_complete) {}\n',
    'scripts/quests/quest_cook/configs/cook.varp': '[cookquest]\nscope=perm\n',
};

test('quest points: counted quests with perm stage vars pass', () => {
    assert.equal(world(base).status, 0);
});

test('quest points: a ported quest missing from count_questpoints fails', () => {
    const r = world({ ...base,
        'scripts/quests/quest_losttribe/scripts/lt.rs2': 'if (%lost_tribe = ^lost_tribe_complete) {}\n',
        'scripts/quests/quest_losttribe/configs/lt.varp': '[lost_tribe]\nscope=perm\n' });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /quest_losttribe[\s\S]*not counted by count_questpoints/);
});

test('quest points: a varbit stage var on a non-perm base varp fails', () => {
    const r = world({ ...base,
        'scripts/general/scripts/quests.rs2': '[proc,count_questpoints]()(int)\nif (%cookquest = ^cook_complete) {}\nif (%horrorquest = ^horror_complete) {}\n',
        'scripts/quests/quest_horror/scripts/h.rs2': 'if (%horrorquest = ^horror_complete) {}\n',
        'scripts/quests/quest_horror/configs/h.varbit': '[horrorquest]\nbasevar=deephorror\n',
        'scripts/quests/quest_horror/configs/h.varp': '[deephorror]\ntransmit=yes\n' });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /varbit horrorquest sits in varp deephorror, which is not scope=perm/);
});
