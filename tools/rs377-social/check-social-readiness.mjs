#!/usr/bin/env node
/** Read-only preflight for the local JoshRS 377 friends/PM service. Never opens DB or saves. */
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function parseWhitelistedEnv(text) {
  const allowed = new Set(['FRIEND_SERVER', 'EASY_STARTUP', 'FRIEND_PORT', 'NODE_PORT', 'WEB_PORT']);
  const result = {};
  for (const line of String(text).replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (!match || !allowed.has(match[1])) continue;
    const value = match[2].replace(/\s+#.*$/, '').trim().replace(/^(?:"([^"]*)"|'([^']*)')$/, (_, a, b) => a ?? b);
    result[match[1]] = value;
  }
  return result;
}

export function numericPort(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (!/^\d{1,5}$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= 65535 ? n : null;
}

export function boolFlag(value) {
  if (value === undefined) return false;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

export function classify(flags, ports) {
  const configured = boolFlag(flags.FRIEND_SERVER);
  const autostart = boolFlag(flags.EASY_STARTUP);
  const listener = ports.friends;
  let diagnosis;
  if (!configured) diagnosis = 'friend-server-disabled-in-env-file';
  else if (!listener) diagnosis = autostart ? 'friend-listener-missing' : 'friend-service-requires-separate-startup';
  else diagnosis = 'friend-listener-present-presence-not-yet-verified';
  return {
    schema: 'joshrs-social-preflight-v1',
    friend_server_configured: configured,
    easy_startup_configured: autostart,
    game_listener: ports.game,
    web_listener: ports.web,
    friend_listener: listener,
    diagnosis,
    limitations: [
      'Read-only file and TCP inspection, not runtime environment attestation',
      'Open port does not prove player registration, privacy visibility or private-message delivery',
      'Luna is a server-side bot and needs separate presence and message routing',
      'If FRIEND_SERVER was false when the current Node process started, editing .env will not enable it without a controlled future restart'
    ],
    runtime_restarted: false,
    accounts_or_saves_accessed: false,
    configuration_changed: false
  };
}

export async function testPort(port, timeoutMs = 600) {
  if (port === null) return false;
  return new Promise(resolve => {
    const socket = new net.Socket();
    let ended = false;
    const end = success => { if (ended) return; ended = true; socket.destroy(); resolve(success); };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => end(true));
    socket.once('timeout', () => end(false));
    socket.once('error', () => end(false));
    socket.connect(port, '127.0.0.1');
  });
}

export async function run(root) {
  const statePath = path.join(root, 'runtime', 'jparris-377', 'active.json');
  const state = JSON.parse((await fs.readFile(statePath, 'utf8')).replace(/^\uFEFF/, ''));
  if (typeof state.engine !== 'string' || !path.isAbsolute(state.engine)) throw new Error('active.json has no absolute engine path');
  const text = (await fs.readFile(path.join(state.engine, '.env'), 'utf8')).replace(/^\uFEFF/, '');
  const flags = parseWhitelistedEnv(text);
  const friendPort = numericPort(flags.FRIEND_PORT, 45099);
  const gamePort = numericPort(flags.NODE_PORT, 52402);
  const webPort = numericPort(flags.WEB_PORT, 8888);
  const [friends, game, web] = await Promise.all([testPort(friendPort), testPort(gamePort), testPort(webPort)]);
  return { ...classify(flags, { friends, game, web }), port_numbers: { friends: friendPort, game: gamePort, web: webPort } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = process.argv[2];
  if (!root || process.argv.length !== 3) {
    console.error('Usage: node check-social-readiness.mjs <existing JoshRS launcher root>');
    process.exitCode = 2;
  } else {
    run(path.resolve(root)).then(result => console.log(JSON.stringify(result, null, 2))).catch(() => {
      console.error('Unable to read active.json or the selected runtime .env. No changes were made.');
      process.exitCode = 1;
    });
  }
}
