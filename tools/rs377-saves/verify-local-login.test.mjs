import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { inspectAccount, checkLocalPassword } from './verify-local-login.mjs';

function fixture(username = 'elrothiro') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-login-'));
  const engine = path.join(root, 'engine');
  fs.mkdirSync(engine);
  fs.writeFileSync(path.join(engine, 'package.json'), '{"name":"synthetic-only"}');
  fs.mkdirSync(path.join(root, 'runtime', 'jparris-377'), { recursive: true });
  fs.writeFileSync(path.join(root, 'runtime', 'jparris-377', 'active.json'), JSON.stringify({ engine }));
  const db = new DatabaseSync(path.join(engine, 'db.sqlite'));
  db.exec('CREATE TABLE account (username TEXT NOT NULL, password TEXT NOT NULL)');
  db.prepare('INSERT INTO account (username,password) VALUES (?, ?)').run(username, '$2b$10$synthetic-fixture-hash-not-real');
  db.close();
  return { root, engine, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test('find exact player account', () => {
  const x = fixture();
  try {
    const account = inspectAccount(x.root);
    assert.equal(account.status, 'ACCOUNT_FOUND');
    assert.ok(account.storedHash.startsWith('$2b$'));
  } finally { x.cleanup(); }
});

test('read Windows PowerShell 5.1 UTF-8 BOM active.json without rewriting it', () => {
  const x = fixture();
  try {
    const statePath = path.join(x.root, 'runtime', 'jparris-377', 'active.json');
    const original = fs.readFileSync(statePath);
    const withBom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), original]);
    fs.writeFileSync(statePath, withBom);
    assert.equal(inspectAccount(x.root).status, 'ACCOUNT_FOUND');
    assert.ok(fs.readFileSync(statePath).equals(withBom), 'read-only check must not modify active.json');
  } finally { x.cleanup(); }
});

test('read repeated BOMs, spaces and CRLF without changing active.json', () => {
  const x = fixture();
  try {
    const statePath = path.join(x.root, 'runtime', 'jparris-377', 'active.json');
    const original = fs.readFileSync(statePath);
    const mixedPrefix = Buffer.from([0xef, 0xbb, 0xbf, 0x20, 0x0d, 0x0a, 0xef, 0xbb, 0xbf]);
    const padded = Buffer.concat([mixedPrefix, original]);
    fs.writeFileSync(statePath, padded);
    assert.equal(inspectAccount(x.root).status, 'ACCOUNT_FOUND');
    assert.ok(fs.readFileSync(statePath).equals(padded));
  } finally { x.cleanup(); }
});

test('malformed state fails without echoing configuration content', () => {
  const x = fixture();
  try {
    const statePath = path.join(x.root, 'runtime', 'jparris-377', 'active.json');
    fs.writeFileSync(statePath, '\uFEFF{' + 'PRIVATE_SENTINEL');
    assert.throws(() => inspectAccount(x.root), err => {
      assert.match(err.message, /ACTIVE_JSON_PARSE_FAILED/);
      assert.doesNotMatch(err.message, /PRIVATE_SENTINEL/);
      return true;
    });
  } finally { x.cleanup(); }
});

test('detect account case mismatch and never prompt', async () => {
  const x = fixture('Elrothiro');
  try {
    assert.equal(inspectAccount(x.root).status, 'ACCOUNT_CASE_MISMATCH');
    assert.equal(await checkLocalPassword(x.root, 'any'), 'ACCOUNT_CASE_MISMATCH');
  } finally { x.cleanup(); }
});

test('match server lowercase password policy without changing SQLite', async () => {
  const x = fixture();
  try {
    const original = fs.readFileSync(path.join(x.engine, 'db.sqlite'));
    const calls = [];
    const compare = async (secret, hash) => { calls.push([secret, hash]); return secret === 'hello123'; };
    assert.equal(await checkLocalPassword(x.root, 'HeLLo123', 'elrothiro', compare), 'PASSWORD_MATCHES_ACTIVE_DATABASE');
    assert.equal(await checkLocalPassword(x.root, 'wrong', 'elrothiro', compare), 'PASSWORD_DOES_NOT_MATCH_ACTIVE_DATABASE');
    assert.equal(calls[0][0], 'hello123');
    assert.ok(original.equals(fs.readFileSync(path.join(x.engine, 'db.sqlite'))));
  } finally { x.cleanup(); }
});

test('missing account and missing database fail closed', async () => {
  const x = fixture('other');
  try {
    assert.equal(await checkLocalPassword(x.root, 'any'), 'ACCOUNT_MISSING');
    fs.rmSync(path.join(x.engine, 'db.sqlite'));
    assert.throws(() => inspectAccount(x.root));
  } finally { x.cleanup(); }
});
