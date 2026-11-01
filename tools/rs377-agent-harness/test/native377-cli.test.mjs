import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('../src/native377/cli.mjs',import.meta.url));
const safeEnv={PATH:process.env.PATH,HOME:process.env.HOME};
test('doctor is offline and has no account or private key requirements',()=>{
  const r=spawnSync(process.execPath,[cli,'--doctor'],{encoding:'utf8',env:safeEnv,timeout:5000});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/No network connection or file access performed/);
  assert.match(r.stdout,/isolated/);
});
test('native CLI cannot attempt normal login without an explicit registration approval',()=>{
  const r=spawnSync(process.execPath,[cli,'--login'],{encoding:'utf8',env:safeEnv,timeout:5000});
  assert.equal(r.status,2);
  assert.match(r.stderr,/ACCOUNT_APPROVED=YES/);
});
test('native CLI rejects production port in isolated mode and live world without approval',()=>{
  const r=spawnSync(process.execPath,[cli,'--doctor'],{encoding:'utf8',env:{...safeEnv,JOSHRS_BOT_PORT:'52402'},timeout:5000});
  assert.equal(r.status,2);
  const live=spawnSync(process.execPath,[cli,'--doctor'],{encoding:'utf8',env:{...safeEnv,JOSHRS_BOT_WORLD:'family'},timeout:5000});
  assert.equal(live.status,2);
  assert.match(live.stderr,/approval/);
});
