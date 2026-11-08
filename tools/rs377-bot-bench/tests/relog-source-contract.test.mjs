// Source-contract regression checks for the deployed Fred/George overlay.
// Does NOT simulate a live JoshRS world or prove in-game presence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const bot=fs.readFileSync(new URL('../engine-patch/src/engine/bot/FredGeorgeBot.ts', import.meta.url),'utf8');
const tick=bot.slice(bot.indexOf('export function tickFredAndGeorgeBots('),bot.indexOf('/**\n * Formats authoritative bot whereabouts'));
const spawn=bot.slice(bot.indexOf('function spawnSingleBot('),bot.indexOf('export function spawnFredAndGeorgeBots'));
test('relogVerified only after real active and admitted world player',()=>{
  assert.match(tick,/if \(admitted && admitted\.slot >= 0 && admitted\.isActive && !admitted\.loggingOut\)/);
  assert.equal((tick.match(/state\.relogVerified = true;/g)||[]).length,1);
  assert.ok(tick.indexOf('state.relogVerified = true;')>tick.indexOf('if (admitted &&'));
  const pending=tick.slice(tick.indexOf('if (state.relogPending)'),tick.indexOf('if (state.relogTick >= 0)'));
  assert.doesNotMatch(pending,/state\.relogVerified\s*=\s*true/);
});
test('never queue duplicate bot while logout or world admission still pending',()=>{
  assert.match(spawn,/world\.getPlayerByUsername\(name\)/);
  assert.match(tick,/world\.logoutRequests\.has\(fredGeorgeLogoutAccountKey\(name, player\)\) \|\| admitted/);
  assert.match(tick,/fredGeorgeLogoutAccountKey\(name, player\)/);
  assert.match(tick,/state\.relogAttempts < 3/);
  assert.match(tick,/relog_admission_failed_after_three_retries/);
});
test('never replace an existing invalid or missing character with a new save during recovery',()=>{
  assert.match(spawn,/Existing bot save failed CRC; refusing to respawn/);
  assert.match(spawn,/Existing bot save missing; refusing to reset/);
  assert.match(tick,/blocked_invalid_or_missing_relog_save/);
});
test('report distinguishes verified admission, pending retry and offline status',()=>{
  assert.match(bot,/relog_waiting_since_tick: b\.relogTick/);
  assert.match(bot,/relog_attempts: b\.relogAttempts/);
  assert.match(bot,/world_admitted: Boolean\(p && p\.isActive && p\.slot >= 0 && !p\.loggingOut\)/);
});
