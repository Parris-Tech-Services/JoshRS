#!/usr/bin/env node
// Live checks for the private revision-274 browser world. Run from the engine directory so
// `ws` and `node-forge` resolve and `data/config/private.pem` is the world's own key:
//
//   cd ~/lc274/engine && node <repo>/tools/play274/verify-world.mjs --host 10.8.0.1 --user myname
//
// It proves more than HTTP 200: the browser client assets load, the WebSocket accepts the
// allowlisted origin and rejects a foreign one, and a real login packet is RSA-signed with
// the world key and answered with the in-game response byte (2). It never moves, saves or
// deletes a player; use a throwaway username.
import { createRequire } from 'node:module';
import { createPrivateKey } from 'node:crypto';
import fs from 'node:fs';

// Resolve `ws` from the engine directory this script is run inside (it owns the dependency).
const require = createRequire(process.cwd() + '/');
const WebSocket = require('ws');

const args = process.argv.slice(2);
const arg = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const HOST = arg('host', '10.8.0.1');
const PORT = Number(arg('port', '8888'));
const USER = arg('user', 'verify274');
const PASS = arg('pass', 'verify-pass');
const SECURE = args.includes('--secure');
const ORIGIN = SECURE ? `https://${HOST}` : `http://${HOST}:${PORT}`;
const BASE = SECURE ? `https://${HOST}` : `http://${HOST}:${PORT}`;
const WS_URL = SECURE ? `wss://${HOST}/` : `ws://${HOST}:${PORT}/`;

const status = async (path) => (await fetch(`${BASE}${path}`)).status;
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

check('http /rs2.cgi', (await status('/rs2.cgi')) === 200);
check('browser client /client/client.js', (await status('/client/client.js')) === 200);
check('cache checksums /crc', (await status('/crc')) === 200);

const tryOrigin = (origin) => new Promise((resolve) => {
    const ws = new WebSocket(WS_URL, 'binary', { origin });
    const timer = setTimeout(() => { ws.terminate(); resolve(false); }, 5000);
    ws.on('open', () => { clearTimeout(timer); ws.close(); resolve(true); });
    ws.on('error', () => { clearTimeout(timer); resolve(false); });
});
check('websocket allowlisted origin', await tryOrigin(ORIGIN));
check('websocket foreign origin rejected', !(await tryOrigin('http://evil.example')));

function modPow(b, e, m) { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = (r * b) % m; e >>= 1n; b = (b * b) % m; } return r; }
const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return b; };

const crc = Buffer.from(await (await fetch(`${BASE}/crc`)).arrayBuffer()).subarray(0, 36);
const ws = new WebSocket(WS_URL, 'binary', { origin: ORIGIN });
let chunks = [];
let waiter = null;
ws.on('message', (d) => { chunks.push(Buffer.from(d)); if (waiter) { const w = waiter; waiter = null; w(); } });
const read = (n) => new Promise((res) => {
    const grab = () => {
        const all = Buffer.concat(chunks);
        if (all.length < n) { waiter = grab; return; }
        chunks = [all.subarray(n)];
        res(all.subarray(0, n));
    };
    grab();
});
await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); });
ws.send(Buffer.from([14, 0]));
await read(8); await read(1);
const seedPkt = await read(8);
const seeds = [(Math.random() * 0xffffffff) >>> 0, (Math.random() * 0xffffffff) >>> 0, seedPkt.readUInt32BE(0), seedPkt.readUInt32BE(4)];
const plain = Buffer.concat([
    Buffer.from([10]), ...seeds.map(u32), u32(1337),
    Buffer.from(USER, 'latin1'), Buffer.from([10]),
    Buffer.from(PASS, 'latin1'), Buffer.from([10])
]);
const jwk = createPrivateKey(fs.readFileSync('data/config/private.pem', 'ascii')).export({ format: 'jwk' });
const n = BigInt('0x' + Buffer.from(jwk.n, 'base64url').toString('hex'));
const e = BigInt('0x' + Buffer.from(jwk.e, 'base64url').toString('hex'));
let hex = modPow(BigInt('0x' + plain.toString('hex')), e, n).toString(16);
if (hex.length & 1) hex = '0' + hex;
const cipher = Buffer.from(hex, 'hex');
const body = Buffer.concat([Buffer.from([255, 274 >> 8, 274 & 0xff, 0]), crc, Buffer.from([cipher.length]), cipher]);
ws.send(Buffer.concat([Buffer.from([16, body.length]), body]));
const response = (await read(1))[0];
ws.close();
check('login accepted (in-game response 2)', response === 2, `response=${response}`);

const failed = results.filter((r) => !r.ok);
console.log(failed.length === 0 ? 'WORLD_VERIFIED' : 'WORLD_CHECK_FAILED');
process.exit(failed.length === 0 ? 0 : 1);
