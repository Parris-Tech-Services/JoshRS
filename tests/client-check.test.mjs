import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { teleCommand, viewportStats, blackVerdict, validateCheckpoints } from '../tools/visual/client-check-lib.mjs';

test('teleCommand reproduces the ::tele Josh used for Uzer', () => {
    // Josh typed ::tele 0,54,48,35,18 on the phone; that is tile 3491,3090.
    assert.equal(teleCommand({ x: 3491, z: 3090 }), '::tele 0,54,48,35,18');
    assert.equal(teleCommand({ x: 3209, z: 3219, level: 1 }), '::tele 1,50,50,9,19');
});

const img = (w, h, fill) => ({ w, h, data: Array.from({ length: w * h }, (_, i) => fill(i % w, Math.floor(i / w))).flat() });

test('a black viewport with only a small player model is flagged', () => {
    const black = img(40, 40, (x, y) => (x > 18 && x < 22 && y > 10 && y < 30 ? [200, 150, 90, 255] : [0, 0, 0, 255]));
    const v = blackVerdict(viewportStats(black, { x: 0, y: 0, w: 40, h: 40 }));
    assert.equal(v.black, true);
});

test('a normal scene and a cave allowed to be dark pass', () => {
    const grass = img(40, 40, () => [60, 120, 40, 255]);
    assert.equal(blackVerdict(viewportStats(grass, { x: 0, y: 0, w: 40, h: 40 })).black, false);
    const cave = img(40, 40, () => [0, 0, 0, 255]);
    assert.equal(blackVerdict(viewportStats(cave, { x: 0, y: 0, w: 40, h: 40 }), true).black, false);
});

test('bundled checkpoints are valid and bad ones are named', () => {
    assert.deepEqual(validateCheckpoints(JSON.parse(readFileSync('tools/visual/checkpoints/ported-quest-starts.json', 'utf8'))), []);
    assert.deepEqual(validateCheckpoints({ checkpoints: [{ name: 'a', x: -1, z: 5, level: 7 }] }),
        ['checkpoint 1: x must be a tile coordinate', 'checkpoint 1: level must be 0-3']);
});
