import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

// SOURCE CONTRACT only: this cannot replace an isolated level-47/48 gameplay
// test. Do not inspect JParrisDesktop player data or start any server.
const dir = dirname(fileURLToPath(import.meta.url));
const script = readFileSync(resolve(dir, '../../expansions/rs377-fixes/scripts/shortcut_sinclair_log.rs2'), 'utf8');

test('all three native Sinclair log objects handle Walk-across from bank', () => {
  for (const id of [9322, 9323, 9324]) {
    assert.match(script, new RegExp('\\[aploc1,loc_' + id + '\\] @joshrs_sinclair_log;'));
  }
  assert.match(script, /p_aprange\(5\)/);
});

test('level 47 is rejected and 48 permitted before any movement (source gate)', () => {
  const gate = script.indexOf('if (stat(agility) < 48)');
  const msg = script.indexOf('You need an Agility level of 48');
  const teleport = script.indexOf('p_teleport($start)');
  assert.ok(gate > 0 && msg > gate && teleport > msg, 'level requirement must run before teleport');
  assert.match(script, /if \(stat\(agility\) < 48\) \{[\s\S]*?return;/);
});

test('reward uses historical 4 XP (40 tenths), not Coal Trucks 8.5 XP', () => {
  assert.match(script, /stat_advance\(agility, 40\)/);
  assert.doesNotMatch(script, /stat_advance\(agility, 85\)/);
});

test('reciprocal bank landings are the same level without opening water collision', () => {
  assert.match(script, /def_coord \$start = 0_42_56_34_7;/);
  assert.match(script, /\$start = 0_42_56_34_13;/);
  assert.match(script, /if \(coordz\(coord\) > 3594\)/);
  assert.match(script, /~forcemove\(movecoord\(coord, 0, 0, \$dir\)\)/);
  assert.doesNotMatch(script, /collision_override|noclip|walk_through_water/i);
});
