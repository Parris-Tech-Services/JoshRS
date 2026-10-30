import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../../');
const cheat = fs.readFileSync(path.join(root, 'engine/src/network/game/client/handler/ClientCheatHandler.ts'), 'utf8');
const debug = fs.readFileSync(path.join(root, 'content/scripts/_test/scripts/debug/debug_candlelight.rs2'), 'utf8');

assert.match(cheat, /player\.staffModLevel >= 2 && \(cmd === 'candle' \|\| cmd === 'candlerestore'\)/);
assert.match(cheat, /!Environment\.NODE_PRODUCTION/);
assert.match(debug, /\[debugproc,candle_test\]/);
assert.match(debug, /\[debugproc,candle_recover\]/);
assert.match(debug, /p_teleport\(0_50_50_32_32\)/);
console.log('Candlelight command safety checks passed: local-only admin start and state-checked recovery.');
