#!/usr/bin/env node
// Read-only JoshRS 377 save freshness check. No game processes, credentials,
// SQLite, save bytes or active content are modified or uploaded.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AUTOSAVE_MS = 1500 * 600; // upstream World.ts: 1500 ticks at 600 ms
const GRACE_MS = 5 * 60_000;
const scriptFile = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptFile), '../..');

export function classifySaveAge(ageMs, autosaveMs = AUTOSAVE_MS, graceMs = GRACE_MS) {
  if (!Number.isFinite(ageMs) || ageMs < 0) return 'CLOCK_OR_FILE_TIME_ANOMALY';
  if (ageMs <= autosaveMs + graceMs) return 'WITHIN_AUTOSAVE_WINDOW';
  return 'OLDER_THAN_AUTOSAVE_WINDOW';
}

export function inspectSaves(root, usernames, nowMs = Date.now()) {
  const stateFile = path.join(root, 'runtime', 'jparris-377', 'active.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8').trimStart());
  if (typeof state.engine !== 'string' || !path.isAbsolute(state.engine)) {
    throw new Error('Active JoshRS engine path is missing or not absolute');
  }
  const engine = fs.realpathSync(state.engine);
  const players = path.join(engine, 'data', 'players', 'main');
  return usernames.map(username => {
    // Reject slashes, traversal, profile separators, and unexpected account names.
    if (!/^[a-z0-9_ -]{1,12}$/i.test(username) || username.trim() !== username) {
      throw new Error('Invalid account name');
    }
    const saveFile = path.join(players, `${username.toLowerCase()}.sav`);
    try {
      const stats = fs.statSync(saveFile);
      if (!stats.isFile()) throw new Error('Not a regular save file');
      const ageMs = nowMs - stats.mtimeMs;
      return { username, exists: true, sizeBytes: stats.size,
        modifiedUtc: stats.mtime.toISOString(), ageMinutes: Math.round(ageMs / 60_000 * 10) / 10,
        status: classifySaveAge(ageMs) };
    } catch (err) {
      if (err.code === 'ENOENT') return { username, exists: false, status: 'SAVE_FILE_MISSING' };
      throw err;
    }
  });
}

function main() {
  const usernames = process.argv.slice(2).length ? process.argv.slice(2) : ['elrothiro', 'sylvie'];
  const records = inspectSaves(defaultRoot, usernames);
  console.log('JoshRS 377 read-only save-freshness inspection');
  console.log(`Upstream autosave interval: ${AUTOSAVE_MS / 60_000} minutes; reporting grace: ${GRACE_MS / 60_000} minutes.`);
  for (const r of records) {
    if (!r.exists) console.log(`${r.username}: SAVE_FILE_MISSING`);
    else console.log(`${r.username}: ${r.status}; ${r.ageMinutes}m old; ${r.modifiedUtc}; ${r.sizeBytes} bytes`);
  }
  console.log('IMPORTANT: Save timestamps alone cannot prove player online status, healthy autosaves, or saved quest state.');
  console.log('A stale timestamp for an offline account is normal. Do not stop the server or repair saves based solely on this report.');
  console.log('No files were changed. No account credentials or save contents were read.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptFile) {
  try { main(); } catch (err) {
    console.error('READ-ONLY INSPECTION FAILED: ' + err.message);
    process.exitCode = 1;
  }
}
