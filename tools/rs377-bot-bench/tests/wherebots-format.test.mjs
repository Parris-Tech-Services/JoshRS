import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

// Source-only check. Does not connect to a live world or infer in-game delivery.
const text = fs.readFileSync(new URL('../engine-patch/src/engine/bot/FredGeorgeBot.ts', import.meta.url), 'utf8');
const begin = text.indexOf('export function formatBotWhereabouts(');
const end = text.indexOf('Handles bidirectional Private Messaging', begin);
const locator = text.slice(begin, end);

test('locator messages contain no unsupported colour markup', () => {
  assert.ok(begin >= 0 && end > begin, 'locator function must exist');
  assert.doesNotMatch(locator, /@(?:dre|bla|blu|gre|yel|red)@/);
});

test('plain-text status retains same-world vs isolated-world distinction', () => {
  assert.match(locator, /ONLINE \(same world\)/);
  assert.match(locator, /ONLINE \(Isolated Test World/);
  assert.match(locator, /OFFLINE \(no active session found\)/);
  assert.match(locator, /currentTask|current_task/);
  assert.match(locator, /x=\$\{/);
});

test('engine handler displays locator lines as ordinary game messages', () => {
  const handler = fs.readFileSync(new URL('../engine-patch/src/network/game/client/handler/ClientCheatHandler.ts', import.meta.url), 'utf8');
  assert.match(handler, /formatBotWhereabouts\(World, target\)/);
  assert.match(handler, /player\.messageGame\(line\)/);
});
