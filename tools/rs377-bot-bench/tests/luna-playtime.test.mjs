import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Source-only evidence: does NOT certify current JParrisDesktop game or repair Luna.sav.
const luna = fs.readFileSync(new URL('../engine-patch/src/engine/entity/BotPlayer.ts', import.meta.url), 'utf8');
const player = fs.readFileSync(new URL('../engine-patch/src/engine/entity/Player.ts', import.meta.url), 'utf8');
const login = fs.readFileSync(new URL('../engine-patch/src/server/login/LoginServer.ts', import.meta.url), 'utf8');
const world = fs.readFileSync(new URL('../engine-patch/src/engine/World.ts', import.meta.url), 'utf8');

test('Luna restores saved lifetime ticks when resumed', () => {
  const i = luna.indexOf('constructor(username: string, username37: bigint, hash64: bigint, saved?: Player');
  const j = luna.indexOf('this.ensureCompanionSupplies();', i);
  assert.ok(i >= 0 && j > i);
  const body = luna.slice(i,j);
  assert.match(body, /if \(saved\) \{[\s\S]*?this\.playtime = saved\.playtime;/);
  assert.equal((body.match(/this\.playtime\s*=\s*saved\.playtime/g)||[]).length, 1);
});

test('native save persists playtime and has a monotonic anti-rollback guard', () => {
  assert.match(player, /sav\.p4\(this\.playtime\)/);
  assert.match(login, /existingSave\.playtime > newSave\.playtime/);
  assert.match(login, /console\.error\(username, 'Invalid save file'\)/);
});

test('Luna startup receives the saved native player, rather than starting over', () => {
  assert.match(world, /PlayerLoading\.load\('Luna', new Packet\(fs\.readFileSync\(savePath\)\), null\)/);
  assert.match(world, /new BotPlayerCtor\('Luna', toBase37\('Luna'\), toBase37\('Luna'\), saved\)/);
});
