import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJm2Locs, parseLocPack } from './inspect-sinclair.mjs';

test('JM2 loc parser preserves level, world tile, loc type, rotation', () => {
  const jm2 = '==== MAP ====\n0 1 2: h3 u49\n==== LOC ====\n0 7 6: 16540 10 1\n1 8 9: 1751 0 3\n==== NPC ====\n';
  assert.deepEqual(parseJm2Locs('m42_56.jm2', jm2), [
    { level: 0, x: 2695, z: 3590, id: 16540, shape: 10, angle: 1 },
    { level: 1, x: 2696, z: 3593, id: 1751, shape: 0, angle: 3 }
  ]);
});

test('LOC index parser returns numeric ID to identifier mapping', () => {
  const names = parseLocPack('0=mcannoncrate\r\n1751=loc_1751\r\n16540=sinclair_logbalance\r\n');
  assert.equal(names.get(16540), 'sinclair_logbalance');
  assert.equal(names.get(1751), 'loc_1751');
  assert.equal(names.has(16541), false);
});

test('rejects bad map regions and missing LOC section', () => {
  assert.throws(() => parseJm2Locs('oops.txt', '==== LOC ====\n'), /Invalid JM2/);
  assert.throws(() => parseJm2Locs('m42_56.jm2', '==== MAP ===='), /Missing LOC/);
});
