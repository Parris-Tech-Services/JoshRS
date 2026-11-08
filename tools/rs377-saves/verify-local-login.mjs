#!/usr/bin/env node
// Read-only, local verification of JoshRS 377's existing Elrothiro account.
// Never uploads, logs, persists or passes credentials in command-line arguments.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const scriptPath = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(scriptPath), '../..');

function activeEngine(repoRoot) {
  const statePath = path.join(repoRoot, 'runtime', 'jparris-377', 'active.json');
  // Windows PowerShell 5.1 writes UTF-8 JSON with a BOM by default.
  // Strip only the optional leading marker; never rewrite active.json.
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8').replace(/^\uFEFF/, ''));
  if (typeof state.engine !== 'string' || !path.isAbsolute(state.engine)) {
    throw new Error('Invalid active.json engine path');
  }
  const engine = fs.realpathSync(state.engine);
  if (!fs.statSync(path.join(engine, 'package.json')).isFile()) {
    throw new Error('Active engine has no package.json');
  }
  return engine;
}

export function inspectAccount(repoRoot, username = 'elrothiro') {
  if (!/^[a-z0-9_ -]{1,12}$/.test(username)) throw new Error('Invalid account identifier');
  const engine = activeEngine(repoRoot);
  const dbPath = path.join(engine, 'db.sqlite');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const checks = db.prepare('PRAGMA quick_check').all();
    if (checks.length === 0 || checks.some(check => check.quick_check !== 'ok')) {
      throw new Error('SQLite quick_check failed');
    }
    const row = db.prepare('SELECT password FROM account WHERE username = ? LIMIT 1').get(username);
    if (row === undefined) {
      const differingCase = db.prepare('SELECT 1 AS found FROM account WHERE lower(username) = lower(?) LIMIT 1').get(username);
      return { status: differingCase ? 'ACCOUNT_CASE_MISMATCH' : 'ACCOUNT_MISSING', engine };
    }
    if (typeof row.password !== 'string' || !/^\$2[aby]\$\d\d\$/.test(row.password)) {
      return { status: 'INVALID_STORED_HASH', engine };
    }
    return { status: 'ACCOUNT_FOUND', engine, storedHash: row.password };
  } finally {
    db.close();
  }
}

export async function checkLocalPassword(repoRoot, password, username = 'elrothiro', compareOverride = null) {
  const account = inspectAccount(repoRoot, username);
  if (account.status !== 'ACCOUNT_FOUND') return account.status;
  if (typeof password !== 'string' || password.length === 0) return 'EMPTY_PASSWORD';
  let compare = compareOverride;
  if (!compare) {
    // Resolve bcrypt from the active engine, not another checkout.
    const engineRequire = createRequire(path.join(account.engine, 'package.json'));
    const resolved = engineRequire.resolve('bcrypt-ts');
    const mod = await import(pathToFileURL(resolved).href);
    compare = mod.compare ?? mod.default?.compare;
    if (typeof compare !== 'function') throw new Error('Active engine bcrypt-ts.compare unavailable');
  }
  const matched = await compare(password.toLowerCase(), account.storedHash);
  return matched ? 'PASSWORD_MATCHES_ACTIVE_DATABASE' : 'PASSWORD_DOES_NOT_MATCH_ACTIVE_DATABASE';
}

function hiddenInput(label) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run interactively in PowerShell. Password arguments and redirected input are deliberately unsupported.');
  }
  process.stdout.write(label);
  return new Promise((resolve, reject) => {
    let password = '';
    process.stdin.setEncoding('utf8');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (err) => {
      process.stdin.off('data', keypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (err) reject(err);
      else resolve(password);
    };
    const keypress = (input) => {
      for (const key of input) {
        if (key === '\u0003') { finish(new Error('Cancelled')); return; }
        if (key === '\r' || key === '\n') { finish(); return; }
        if (key === '\u007f' || key === '\b') { password = password.slice(0, -1); continue; }
        if (key < ' ' || password.length >= 128) continue;
        password += key;
      }
    };
    process.stdin.on('data', keypress);
  });
}

async function main() {
  const account = inspectAccount(DEFAULT_ROOT);
  if (account.status !== 'ACCOUNT_FOUND') {
    console.log('RESULT: ' + account.status);
    return;
  }
  console.log('Elrothiro account exists in the configured local engine. This tool is read-only.');
  const password = await hiddenInput('Enter Elrothiro password (hidden): ');
  console.log('RESULT: ' + await checkLocalPassword(DEFAULT_ROOT, password));
  console.log('A password match does not prove the running server is using this database.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch(err => {
    console.error('CHECK FAILED: ' + err.message.replace(/\r|\n/g, ' '));
    process.exitCode = 1;
  });
}
