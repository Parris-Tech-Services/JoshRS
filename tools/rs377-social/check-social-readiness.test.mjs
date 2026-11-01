import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { parseWhitelistedEnv, numericPort, boolFlag, classify, testPort, run } from './check-social-readiness.mjs';

test('whitelists only harmless flags and ports, never credentials', () => {
  const e = parseWhitelistedEnv('DB_PASS=secret\nFRIEND_SERVER=true\nEASY_STARTUP="true"\nFRIEND_PORT=45099\n# PRIVATE_CHAT=x\nWEB_PORT=8888\n');
  assert.deepEqual(e, { FRIEND_SERVER: 'true', EASY_STARTUP: 'true', FRIEND_PORT: '45099', WEB_PORT: '8888' });
  assert.equal(JSON.stringify(e).includes('secret'), false);
});
test('rejects malformed ports instead of probing unexpected targets', () => {
  assert.equal(numericPort('65536', 45099), null);
  assert.equal(numericPort('0', 45099), null);
  assert.equal(numericPort('45099; rm -rf', 45099), null);
  assert.equal(numericPort(undefined, 45099), 45099);
  assert.equal(numericPort('1234', 45099), 1234);
});
test('recognises true flags and defaults absent to false', () => {
  assert.equal(boolFlag('TRUE'), true);
  assert.equal(boolFlag('off'), false);
  assert.equal(boolFlag(undefined), false);
});
test('disabled friend server is called out despite live game ports', () => {
  const out = classify({EASY_STARTUP:'true'}, {friends: false, game:true, web:true});
  assert.equal(out.diagnosis, 'friend-server-disabled-in-env-file');
  assert.equal(out.configuration_changed, false);
});
test('friend listener missing is a separate diagnosis', () => {
  const out = classify({ FRIEND_SERVER:'true', EASY_STARTUP:'true' }, {friends:false, game:true,web:true});
  assert.equal(out.diagnosis,'friend-listener-missing');
});
test('friend service with EASY_STARTUP false needs separate managed startup', () => {
  const out = classify({ FRIEND_SERVER:'true' }, {friends:false, game:true, web:true});
  assert.equal(out.diagnosis,'friend-service-requires-separate-startup');
});
test('open listener cannot prove real player presence', () => {
  const out = classify({FRIEND_SERVER:'true', EASY_STARTUP:'true'}, {friends:true, game:true,web:true});
  assert.equal(out.diagnosis, 'friend-listener-present-presence-not-yet-verified');
  assert.match(out.limitations.join(' '), /does not prove player registration/);
});
test('can probe open TCP port without sending game data', async () => {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { assert.equal(await testPort(server.address().port), true); }
  finally { await new Promise(resolve => server.close(resolve)); }
});
test('can probe closed port without hanging', async () => {
  const s = net.createServer();
  await new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
  const port = s.address().port;
  await new Promise(resolve => s.close(resolve));
  assert.equal(await testPort(port, 250), false);
});
test('reads only active.json and .env; never changes them', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'joshrs-social-'));
  try {
    const engine=path.join(root,'engine');
    const runtime=path.join(root,'runtime','jparris-377');
    await fs.mkdir(runtime,{recursive:true}); await fs.mkdir(engine);
    const env=path.join(engine,'.env');
    const state=path.join(runtime,'active.json');
    await fs.writeFile(env,'FRIEND_SERVER=false\nDB_PASS=not-visible\nNODE_PORT=65500\nWEB_PORT=65501\nFRIEND_PORT=65502\n');
    await fs.writeFile(state,JSON.stringify({engine}));
    const before=await fs.readFile(env,'utf8');
    const report=await run(root);
    const after=await fs.readFile(env,'utf8');
    assert.equal(report.diagnosis,'friend-server-disabled-in-env-file');
    assert.equal(before,after);
    assert.equal(JSON.stringify(report).includes('not-visible'),false);
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});
