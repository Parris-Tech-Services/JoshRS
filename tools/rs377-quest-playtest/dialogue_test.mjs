#!/usr/bin/env node
// JoshRS 377 dialogue/quest playtester for an ISOLATED world only (refuses the live ports/paths).
// Drives a real protocol session: login, ::cheats, Talk-to NPCs by config name, clicks
// "continue", picks menu options, records every dialogue line, relogs, and reads the save.
//
//   ISO_ENGINE_DIR=... ISO_PORT=52502 ISO_WEB_PORT=8990 node dialogue_test.mjs scenario.json
//
// Scenario: { "user": "name", "steps": [ ...step ] } with steps such as
//   {"cheat":"give ball_of_wool 3"}  {"tele":[0,3492,3235]}  {"talk":"burgh_vilager_3","choices":[3,1]}
//   {"relog":true}  {"expectSaved":{"varp":724,"value":1}}  {"expectSavedItem":{"obj":1759,"count":0}}
//   {"expectText":"Quest started"}  {"wait":2000}
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { createPublicKey } from 'node:crypto';

const ENGINE_DIR = process.env.ISO_ENGINE_DIR, PORT = Number(process.env.ISO_PORT), WEB_PORT = Number(process.env.ISO_WEB_PORT);
const PROFILE = process.env.ISO_PROFILE || 'isotest';
if (!ENGINE_DIR || !PORT || !WEB_PORT) throw new Error('set ISO_ENGINE_DIR, ISO_PORT, ISO_WEB_PORT');
if (PORT === 52402 || WEB_PORT === 8888 || ENGINE_DIR.includes('JoshRS-Launcher')) throw new Error('refusing to test against the live world');
const CONTENT = path.join(ENGINE_DIR, '..', 'content');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const readPack = f => { const m = new Map(); for (const l of fs.readFileSync(path.join(CONTENT, 'pack', f), 'utf8').split(/\r?\n/)) { const x = l.match(/^(\d+)=(.+)$/); if (x) m.set(Number(x[1]), x[2]); } return m; };
const npcNames = readPack('npc.pack'), ifNames = readPack('interface.pack');

const protLen = new Map();
for (const f of ['ServerGameProt.ts', 'ServerGameZoneProt.ts'])
    for (const m of fs.readFileSync(path.join(ENGINE_DIR, 'src/network/game/server', f), 'utf8').matchAll(/new ServerGame(?:Zone)?Prot\((\d+),\s*(-?\d+)\)/g)) protLen.set(Number(m[1]), Number(m[2]));

const crcBuf = Buffer.from(await (await fetch(`http://127.0.0.1:${WEB_PORT}/crc`)).arrayBuffer()).subarray(0, 36);
const jwk = createPublicKey(fs.readFileSync(path.join(ENGINE_DIR, 'data/config/private.pem'), 'utf8')).export({ format: 'jwk' });
const rsaN = BigInt('0x' + Buffer.from(jwk.n, 'base64url').toString('hex')), rsaE = BigInt('0x' + Buffer.from(jwk.e, 'base64url').toString('hex'));
function modPow(b, e, m) { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = (r * b) % m; e >>= 1n; b = (b * b) % m; } return r; }
class Isaac {
    constructor(seed) { this.rsl = new Int32Array(256); this.mem = new Int32Array(256); this.aa = this.bb = this.cc = this.count = 0; seed.forEach((s, i) => (this.rsl[i] = s)); this.init(); }
    init() {
        let a = 0x9e3779b9 | 0, b = a, c = a, d = a, e = a, f = a, g = a, h = a;
        const mix = () => { a ^= b << 11; d = (d + a) | 0; b = (b + c) | 0; b ^= c >>> 2; e = (e + b) | 0; c = (c + d) | 0; c ^= d << 8; f = (f + c) | 0; d = (d + e) | 0; d ^= e >>> 16; g = (g + d) | 0; e = (e + f) | 0; e ^= f << 10; h = (h + e) | 0; f = (f + g) | 0; f ^= g >>> 4; a = (a + f) | 0; g = (g + h) | 0; g ^= h << 8; b = (b + g) | 0; h = (h + a) | 0; h ^= a >>> 9; c = (c + h) | 0; a = (a + b) | 0; };
        for (let i = 0; i < 4; i++) mix();
        for (const src of [this.rsl, this.mem]) for (let i = 0; i < 256; i += 8) {
            a = (a + src[i]) | 0; b = (b + src[i + 1]) | 0; c = (c + src[i + 2]) | 0; d = (d + src[i + 3]) | 0; e = (e + src[i + 4]) | 0; f = (f + src[i + 5]) | 0; g = (g + src[i + 6]) | 0; h = (h + src[i + 7]) | 0;
            mix(); [a, b, c, d, e, f, g, h].forEach((v, k) => (this.mem[i + k] = v));
        }
        this.isaac(); this.count = 256;
    }
    isaac() {
        this.cc = (this.cc + 1) | 0; this.bb = (this.bb + this.cc) | 0;
        for (let i = 0; i < 256; i++) {
            const x = this.mem[i];
            switch (i & 3) { case 0: this.aa ^= this.aa << 13; break; case 1: this.aa ^= this.aa >>> 6; break; case 2: this.aa ^= this.aa << 2; break; case 3: this.aa ^= this.aa >>> 16; break; }
            this.aa = (this.aa + this.mem[(i + 128) & 0xff]) | 0;
            const y = (this.mem[(x >>> 2) & 0xff] + this.aa + this.bb) | 0; this.mem[i] = y;
            this.bb = (this.mem[(y >>> 10) & 0xff] + x) | 0; this.rsl[i] = this.bb;
        }
    }
    nextInt() { if (this.count-- === 0) { this.isaac(); this.count = 255; } return this.rsl[this.count]; }
}

// RS2 walk directions: 0 NW, 1 N, 2 NE, 3 W, 4 E, 5 SW, 6 S, 7 SE
const DIR_X = [-1, 0, 1, -1, 1, -1, 0, 1], DIR_Z = [1, 1, 1, 0, 0, -1, -1, -1];

class Bits {
    constructor(buf) { this.buf = buf; this.pos = 0; }
    g(n) { let v = 0; for (let i = 0; i < n; i++) { const byte = this.buf[this.pos >> 3]; v = (v << 1) | ((byte >> (7 - (this.pos & 7))) & 1); this.pos++; } return v; }
    left() { return this.buf.length * 8 - this.pos; }
}

// One logged-in session with dialogue state.
function connect(user) {
    return new Promise((resolve, reject) => {
        const seed = [11, 22, 33, 44];
        const sock = net.connect(PORT, '127.0.0.1', () => sock.write(Buffer.from([14, 0])));
        const s = { sock, npcs: [], npcType: new Map(), npcPos: new Map(), pos: null, chat: null, closedAt: 0, log: [], broken: false, varpsSent: {} };
        let buf = Buffer.alloc(0), stage = 0, isaacIn, isaacOut, inBuf = Buffer.alloc(0), op = -1, len = -1;
        const text = b => b.subarray(0, b.indexOf(10) >= 0 ? b.indexOf(10) : b.length).toString('latin1');
        const handle = (op, body) => {
            if (op === 63) s.log.push('[game] ' + text(body));
            else if (op === 232) { const t = text(body.subarray(2)); if (t.trim()) s.log.push(t); }
            else if (op === 182) s.varpsSent[(body[0] << 8) | ((body[1] - 128) & 0xff)] = (128 - body[2]) & 0xff; // VARP_SMALL
            else if (op === 115) s.varpsSent[body[4] | (body[5] << 8)] = ((body[1] << 24) | (body[0] << 16) | (body[3] << 8) | body[2]) >>> 0; // VARP_LARGE
            else if (op === 109) { s.chat = body.readUInt16BE(0); s.chatName = ifNames.get(s.chat) || String(s.chat); s.chatAt = Date.now(); }
            else if (op === 29) { s.chat = null; s.closedAt = Date.now(); }
            else if (op === 71) { // NPC_INFO
                const r = new Bits(body);
                const step = (nid, d) => { const p = s.npcPos.get(nid); if (p) { p.x += DIR_X[d]; p.z += DIR_Z[d]; } };
                const count = r.g(8); const keep = [];
                for (let i = 0; i < count; i++) {
                    const nid = s.npcs[i];
                    if (r.g(1) === 0) { keep.push(nid); continue; }
                    const t = r.g(2);
                    if (t === 0) keep.push(nid);
                    else if (t === 1) { step(nid, r.g(3)); r.g(1); keep.push(nid); }
                    else if (t === 2) { step(nid, r.g(3)); step(nid, r.g(3)); r.g(1); keep.push(nid); }
                }
                s.npcs = keep;
                while (r.left() >= 27) {
                    const nid = r.g(14); if (nid === 16383) break;
                    r.g(1); let dz = r.g(5), dx = r.g(5); if (dz > 15) dz -= 32; if (dx > 15) dx -= 32;
                    r.g(1); const type = r.g(13);
                    s.npcs.push(nid); s.npcType.set(nid, type);
                    if (s.pos) s.npcPos.set(nid, { x: s.pos.x + dx, z: s.pos.z + dz });
                }
            }
        };
        const pump = () => {
            while (!s.broken) {
                if (op === -1) { if (inBuf.length < 1) return; op = (inBuf[0] - isaacIn.nextInt()) & 0xff; inBuf = inBuf.subarray(1); len = protLen.get(op); if (len === undefined) { s.broken = true; return; } }
                if (len === -1) { if (inBuf.length < 1) return; len = inBuf[0]; inBuf = inBuf.subarray(1); }
                else if (len === -2) { if (inBuf.length < 2) return; len = inBuf.readUInt16BE(0); inBuf = inBuf.subarray(2); }
                if (inBuf.length < len) return;
                const body = inBuf.subarray(0, len); inBuf = inBuf.subarray(len);
                try { handle(op, body); } catch { /* ignore malformed */ }
                op = -1; len = -1;
            }
        };
        sock.on('error', reject);
        sock.on('data', chunk => {
            if (stage === 2) { inBuf = Buffer.concat([inBuf, chunk]); pump(); return; }
            buf = Buffer.concat([buf, chunk]);
            if (stage === 0 && buf.length >= 17) {
                stage = 1; buf = buf.subarray(17);
                const pw = 'test';
                const plain = Buffer.alloc(1 + 16 + 4 + user.length + 1 + pw.length + 1);
                let p = 0; plain.writeUInt8(10, p++); for (const v of seed) { plain.writeUInt32BE(v, p); p += 4; }
                plain.writeUInt32BE(12345, p); p += 4; plain.write(user, p, 'ascii'); p += user.length; plain.writeUInt8(10, p++);
                plain.write(pw, p, 'ascii'); p += pw.length; plain.writeUInt8(10, p++);
                let hex = modPow(BigInt('0x' + plain.toString('hex')), rsaE, rsaN).toString(16); if (hex.length % 2) hex = '0' + hex;
                let rsa = Buffer.from(hex, 'hex'); if (rsa[0] & 0x80) rsa = Buffer.concat([Buffer.from([0]), rsa]);
                const body = Buffer.alloc(1 + 2 + 1 + 36 + 1 + rsa.length);
                let q = 0; body.writeUInt8(255, q++); body.writeUInt16BE(377, q); q += 2; body.writeUInt8(0, q++);
                crcBuf.copy(body, q); q += 36; body.writeUInt8(rsa.length, q++); rsa.copy(body, q);
                sock.write(Buffer.concat([Buffer.from([16, body.length]), body]));
            } else if (stage === 1 && buf.length >= 1) {
                if (buf[0] !== 2) { sock.destroy(); reject(new Error(`${user}: login reply ${buf[0]}`)); return; }
                if (buf.length < 3) return;
                stage = 2; isaacOut = new Isaac(seed); isaacIn = new Isaac(seed.map(v => v + 50));
                s.send = (o, payload, varByte) => { const enc = (o + isaacOut.nextInt()) & 0xff; sock.write(Buffer.concat([varByte ? Buffer.from([enc, payload.length]) : Buffer.from([enc]), payload])); };
                s.keep = setInterval(() => s.send(40, Buffer.alloc(0)), 3000);
                inBuf = buf.subarray(3); pump(); resolve(s);
            }
        });
    });
}

const cheat = (s, t) => s.send(56, Buffer.concat([Buffer.from(t, 'ascii'), Buffer.from([10])]), true);
const le2 = v => Buffer.from([v & 0xff, (v >> 8) & 0xff]);

const tele = async (s, l, x, z) => { s.pos = { x, z }; cheat(s, `tele ${l},${x >> 6},${z >> 6},${x & 63},${z & 63}`); await sleep(3500); };

// The copy of npcName nearest to the tester (the one ::npcadd just put on our tile).
function nearest(s, npcName) {
    let best, bestD = 1e9;
    for (const n of s.npcs) {
        if (npcNames.get(s.npcType.get(n)) !== npcName) continue;
        const p = s.npcPos.get(n); const d = p && s.pos ? Math.abs(p.x - s.pos.x) + Math.abs(p.z - s.pos.z) : 999;
        if (d < bestD) { bestD = d; best = n; }
    }
    return best;
}

async function talk(s, npcName, choices = []) {
    if (!s.pos) throw new Error('tester position unknown; teleport before talking');
    // Wandering villagers end up behind fences, so spawn a temporary copy of this NPC on our
    // tile (dev cheat ::npcadd, despawns by itself). It runs exactly the same talk scripts.
    cheat(s, `npcadd ${npcName}`);
    await sleep(2500);
    let nid = nearest(s, npcName);
    if (nid === undefined) throw new Error(`NPC ${npcName} not in view (have: ${[...new Set(s.npcs.map(n => npcNames.get(s.npcType.get(n))))].join(', ')})`);
    const queue = [...choices];
    s.log.push(`>> Talk-to ${npcName}`);
    s.send(112, le2(nid)); // OPNPC1
    const t0 = Date.now(); let idleSince = Date.now(), last = null, started = false, retried = false;
    while (Date.now() - t0 < 120000) {
        await sleep(400);
        if (s.chat === null) {
            // Before the first dialogue appears, allow time to walk over to a wandering NPC,
            // and click once more if nothing happened (as a player would).
            if (!started && !retried && Date.now() - t0 > 8000) {
                retried = true; const again = nearest(s, npcName);
                if (again !== undefined) { s.log.push('>> (no reply yet - clicking again)'); s.send(112, le2(again)); }
            }
            if (Date.now() - idleSince > (started ? 4000 : 15000)) break;
            continue;
        }
        started = true; idleSince = Date.now();
        if (s.chat === last && Date.now() - s.chatAt < 300) continue;
        const m = (s.chatName || '').match(/^multi(\d)$/);
        if (m) {
            const n = Number(m[1]); const pick = Math.min(queue.length ? queue.shift() : n, n); // default/overflow: last option (goodbye)
            s.log.push(`>> choose option ${pick} of ${n}`);
            const com = s.chat + 1 + pick; s.chat = null; s.send(79, Buffer.from([(com >> 8) & 0xff, com & 0xff]));
        } else { s.chat = null; s.send(226, Buffer.alloc(2)); }
        last = s.chat; await sleep(300);
    }
    if (queue.length) s.log.push(`!! unused choices: ${queue.join(',')}`);
}

function readSave(user) {
    const b = fs.readFileSync(path.join(ENGINE_DIR, 'data/players', PROFILE, user.toLowerCase() + '.sav'));
    let p = 2; const ver = (b[p] << 8) | b[p + 1]; p = 4 + 2 + 2 + 1 + 7 + 5 + 1 + 2 + (ver >= 2 ? 4 : 2) + 21 * 5;
    const varps = {}; const vc = (b[p] << 8) | b[p + 1]; p += 2;
    for (let i = 0; i < vc; i++) { const id = (b[p] << 8) | b[p + 1]; p += 2; let x = b[p++], r = 0; while (x & 0x80) { r = (r | (x & 0x7f)) << 7; x = b[p++]; } varps[id] = (r | x) >>> 0; }
    const items = {}; const ic = b[p++];
    for (let i = 0; i < ic; i++) { p += 2; const size = (b[p] << 8) | b[p + 1]; p += 2; for (let k = 0; k < size; k++) { const id = ((b[p] << 8) | b[p + 1]) - 1; p += 2; if (id >= 0) { let c = b[p++]; if (c === 255) { c = b.readInt32BE(p); p += 4; } items[id] = (items[id] || 0) + c; } } }
    return { varps, items, mtime: fs.statSync(path.join(ENGINE_DIR, 'data/players', PROFILE, user.toLowerCase() + '.sav')).mtimeMs };
}

async function logout(s, user) {
    const f = path.join(ENGINE_DIR, 'data/players', PROFILE, user.toLowerCase() + '.sav');
    const before = fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0;
    clearInterval(s.keep); s.sock.end();
    const t0 = Date.now(); while (Date.now() - t0 < 90000) { if (fs.existsSync(f) && fs.statSync(f).mtimeMs > before) break; await sleep(800); }
    await sleep(1200);
}

const scen = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let s = await connect(scen.user); await sleep(2500);
let failures = 0, lastTalkAt = 0; const transcript = [];
const flush = () => { transcript.push(...s.log); s.log = []; };
for (const step of scen.steps) {
    try {
        if (step.cheat) { cheat(s, step.cheat); await sleep(1000); }
        else if (step.tele) { const [l, x, z] = step.tele; await tele(s, l, x, z); }
        else if (step.talk) { flush(); lastTalkAt = transcript.length; await talk(s, step.talk, step.choices || []); }
        else if (step.expectInLastTalk) { flush(); const ok = transcript.slice(lastTalkAt).some(t => t.includes(step.expectInLastTalk)); transcript.push(`${ok ? 'PASS' : 'FAIL'} last conversation contains "${step.expectInLastTalk}"`); if (!ok) failures++; }
        else if (step.wait) await sleep(step.wait);
        else if (step.relog) { flush(); transcript.push('>> logout / login'); const pos = s.pos; await logout(s, scen.user); s = await connect(scen.user); s.pos = pos; await sleep(3000); }
        else if (step.expectText) { flush(); const ok = transcript.some(t => t.includes(step.expectText)); transcript.push(`${ok ? 'PASS' : 'FAIL'} text contains "${step.expectText}"`); if (!ok) failures++; }
        else if (step.expectVarpSent) { flush(); await sleep(1000); const v = s.varpsSent[step.expectVarpSent.varp] ?? 0; const ok = v === step.expectVarpSent.value; transcript.push(`${ok ? 'PASS' : 'FAIL'} client told varp ${step.expectVarpSent.varp} = ${v} (want ${step.expectVarpSent.value})`); if (!ok) failures++; }
        else if (step.expectNoText) { flush(); const ok = !transcript.some(t => t.includes(step.expectNoText)); transcript.push(`${ok ? 'PASS' : 'FAIL'} text never contains "${step.expectNoText}"`); if (!ok) failures++; }
        else if (step.expectSaved || step.expectSavedItem) {
            flush(); const pos = s.pos; await logout(s, scen.user); const sv = readSave(scen.user);
            if (step.expectSaved) { const v = sv.varps[step.expectSaved.varp] ?? 0; const ok = v === step.expectSaved.value; transcript.push(`${ok ? 'PASS' : 'FAIL'} saved varp ${step.expectSaved.varp} = ${v} (want ${step.expectSaved.value})`); if (!ok) failures++; }
            if (step.expectSavedItem) { const v = sv.items[step.expectSavedItem.obj] ?? 0; const ok = v === step.expectSavedItem.count; transcript.push(`${ok ? 'PASS' : 'FAIL'} saved item ${step.expectSavedItem.obj} x${v} (want ${step.expectSavedItem.count})`); if (!ok) failures++; }
            s = await connect(scen.user); s.pos = pos; await sleep(3000);
        }
        if (s.broken) transcript.push('!! packet decoder lost sync');
    } catch (e) { flush(); transcript.push(`FAIL ${JSON.stringify(step)}: ${e.message}`); failures++; }
}
flush(); clearInterval(s.keep); s.sock.end();
console.log(transcript.join('\n'));
console.log(`RESULT ${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
process.exit(failures ? 1 : 0);
