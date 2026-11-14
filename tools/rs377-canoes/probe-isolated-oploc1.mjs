#!/usr/bin/env node
// Native 377 Canoe Station OPLOC1 probe in ISOLATED disposable world only.
// For each case: log into a throwaway account, teleport near canoe station, send OPLOC1
// (the same packet the Java client sends on Chop-down), disconnect,
// then read the account's save to see which level the server left it on.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { createPublicKey } from 'node:crypto';

const ENGINE_DIR = process.env.ISO_ENGINE_DIR;
const PORT = Number(process.env.ISO_PORT);
const WEB_PORT = Number(process.env.ISO_WEB_PORT);
const PROFILE = process.env.ISO_PROFILE || 'isotest';
if (!ENGINE_DIR || !PORT || !WEB_PORT) throw new Error('set ISO_ENGINE_DIR, ISO_PORT, ISO_WEB_PORT');
if (PORT === 52402 || WEB_PORT === 8888 || ENGINE_DIR.includes('JoshRS-Launcher')) throw new Error('refusing to test against the live world');

const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const crcBuf = Buffer.from(await (await fetch(`http://127.0.0.1:${WEB_PORT}/crc`)).arrayBuffer()).subarray(0, 36);
const jwk = createPublicKey(fs.readFileSync(path.join(ENGINE_DIR, 'data', 'config', 'private.pem'), 'utf8')).export({ format: 'jwk' });
const rsaN = BigInt('0x' + Buffer.from(jwk.n, 'base64url').toString('hex'));
const rsaE = BigInt('0x' + Buffer.from(jwk.e, 'base64url').toString('hex'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

// server packet lengths, read from the engine source of the world under test
const protLen = new Map();
for (const file of ['ServerGameProt.ts', 'ServerGameZoneProt.ts']) {
    for (const m of fs.readFileSync(path.join(ENGINE_DIR, 'src', 'network', 'game', 'server', file), 'utf8').matchAll(/new ServerGame(?:Zone)?Prot\((\d+),\s*(-?\d+)\)/g)) protLen.set(Number(m[1]), Number(m[2]));
}

function login(username) {
    return new Promise((resolve, reject) => {
        const seed = [11, 22, 33, 44];
        const sock = net.connect(PORT, '127.0.0.1', () => sock.write(Buffer.from([14, 0])));
        let buf = Buffer.alloc(0), stage = 0;
        const messages = [];
        let isaacIn = null, inBuf = Buffer.alloc(0), op = -1, len = -1, broken = false, seen = 0;
        const pump = () => {
            while (!broken) {
                if (op === -1) { if (inBuf.length < 1) return; op = (inBuf[0] - isaacIn.nextInt()) & 0xff; inBuf = inBuf.subarray(1); len = protLen.get(op); if (len === undefined) { broken = true; if (process.env.DEBUG_PROT) console.error(`unknown opcode ${op} after ${messages.length} msgs; next bytes ${inBuf.subarray(0, 8).toString('hex')}`); return; } }
                if (process.env.DEBUG_PROT && seen++ < 12) console.error(`op ${op} len ${len}`);
                if (len === -1) { if (inBuf.length < 1) return; len = inBuf[0]; inBuf = inBuf.subarray(1); }
                else if (len === -2) { if (inBuf.length < 2) return; len = inBuf.readUInt16BE(0); inBuf = inBuf.subarray(2); }
                if (inBuf.length < len) return;
                const body = inBuf.subarray(0, len); inBuf = inBuf.subarray(len);
                if (op === 63) messages.push(body.subarray(0, body.indexOf(10) >= 0 ? body.indexOf(10) : body.length).toString('latin1'));
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
                const plain = Buffer.alloc(1 + 16 + 4 + username.length + 1 + pw.length + 1);
                let p = 0; plain.writeUInt8(10, p++);
                for (const s of seed) { plain.writeUInt32BE(s, p); p += 4; }
                plain.writeUInt32BE(12345, p); p += 4;
                plain.write(username, p, 'ascii'); p += username.length; plain.writeUInt8(10, p++);
                plain.write(pw, p, 'ascii'); p += pw.length; plain.writeUInt8(10, p++);
                let hex = modPow(BigInt('0x' + plain.toString('hex')), rsaE, rsaN).toString(16); if (hex.length % 2) hex = '0' + hex;
                let rsa = Buffer.from(hex, 'hex');
                if (rsa[0] & 0x80) rsa = Buffer.concat([Buffer.from([0]), rsa]); // server reads a signed big integer
                const body = Buffer.alloc(1 + 2 + 1 + 36 + 1 + rsa.length);
                let q = 0; body.writeUInt8(255, q++); body.writeUInt16BE(377, q); q += 2; body.writeUInt8(0, q++);
                crcBuf.copy(body, q); q += 36; body.writeUInt8(rsa.length, q++); rsa.copy(body, q);
                sock.write(Buffer.concat([Buffer.from([16, body.length]), body]));
            } else if (stage === 1 && buf.length >= 1) {
                const reply = buf[0];
                if (reply !== 2) { sock.destroy(); reject(new Error(`${username}: login reply ${reply}`)); return; }
                if (buf.length < 3) return; // reply, staff level, flagged
                stage = 2;
                const isaac = new Isaac(seed);
                isaacIn = new Isaac(seed.map(s => s + 50));
                if (process.env.DEBUG_PROT) console.error(`login bytes: ${buf.subarray(0, 12).toString('hex')}`);
                inBuf = buf.subarray(3); pump();
                const send = (op, payload, kind) => {
                    const enc = (op + isaac.nextInt()) & 0xff;
                    const head = kind === 'var' ? Buffer.from([enc, payload.length]) : Buffer.from([enc]);
                    sock.write(Buffer.concat([head, payload]));
                };
                resolve({ sock, send, messages, decodeOk: () => !broken });
            }
        });
    });
}

const cheat = (s, text) => s.send(56, Buffer.concat([Buffer.from(text, 'ascii'), Buffer.from([10])]), 'var');
function oploc1(s, x, z, loc) {
    const b = Buffer.alloc(6);
    b[0] = (x >> 8) & 0xff; b[1] = ((x & 0xff) + 128) & 0xff; // x: g2_alt2
    b[2] = z & 0xff; b[3] = (z >> 8) & 0xff;                 // z: g2_alt1
    b[4] = loc & 0xff; b[5] = (loc >> 8) & 0xff;             // loc: g2_alt1
    s.send(181, b, 'fixed');
}
const teleArg = (lvl, x, z) => `tele ${lvl},${x >> 6},${z >> 6},${x & 63},${z & 63}`;

function readPos(file) {
    const b = fs.readFileSync(file);
    return { x: (b[4] << 8) | b[5], z: (b[6] << 8) | b[7], level: b[8] };
}



const results = [];
for (const c of cases) {
    let s;
    try {
        s = await login(c.user);
        const keep = setInterval(() => s.send(40, Buffer.alloc(0), 'fixed'), 3000);
        try {
            await sleep(2500);
            cheat(s, teleArg(0, c.standX, c.standZ));
            await sleep(3000);
            oploc1(s, c.x, c.z, c.loc);
            await sleep(6000);
            const relevant = s.messages.filter(m => /canoe|woodcutting|nothing interesting|can't reach/i.test(m)).slice(-8);
            const pass = relevant.some(m => m.includes('You need a Woodcutting level of 12 to make a canoe.')) &&
                !relevant.some(m => /nothing interesting happens/i.test(m)) && s.decodeOk();
            const result = { station: c.station, loc: c.loc, pass, messages: relevant, decoderOk: s.decodeOk() };
            results.push(result);
            console.log(JSON.stringify(result));
        } finally {
            clearInterval(keep);
        }
    } catch (error) {
        const result = { station: c.station, loc: c.loc, pass: false, reason: String(error.message || error) };
        results.push(result);
        console.error(JSON.stringify(result));
    } finally {
        s?.sock?.end();
    }
}
const passed = results.filter(r => r.pass).length;
console.log('NATIVE_377_CANOE_OPLOC1_INTERACTION_PROOF ' + passed + '/' + results.length);
process.exitCode = passed === results.length ? 0 : 1;
