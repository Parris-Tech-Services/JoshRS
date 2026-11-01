#!/usr/bin/env node
/**
 * Live Family-World Companion Client for Fred & George (RS2 #377, Port 52402).
 *
 * Connects Fred and George as real RS2 #377 TCP client sessions into the running
 * family world (port 52402) WITHOUT restarting the server or disconnecting active
 * players (Elrothiro / Sylvie / Luna).
 *
 * - Authenticates via the standard RS377 RSA + ISAAC login handshake.
 * - Registers Fred and George online in World 1 so Friends List shows them green ("World 1").
 * - Sends ISAAC-encrypted NO_TIMEOUT (opcode 40) keepalives and MOVE_GAMECLICK (opcode 28)
 *   patrol steps around Lumbridge so Elrothiro can see, follow, trade, and PM them in-game.
 */

import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { createPublicKey } from 'node:crypto';

const ENGINE_DIR =
    process.env.JOSHRS_FAMILY_ENGINE_DIR ||
    'C:\\JoshRS-Launcher\\JoshRS-main\\runtime\\jparris-377\\usb-20261030-203927\\engine';
const HOST = '127.0.0.1';
const PORT = Number.parseInt(process.env.JOSHRS_FAMILY_PORT || '52402', 10);
const WEB_PORT = Number.parseInt(process.env.JOSHRS_FAMILY_WEB_PORT || '8888', 10);
const crcBuf = Buffer.from(await (await fetch(`http://127.0.0.1:${WEB_PORT}/crc`)).arrayBuffer()).subarray(0, 36);

const pem = fs.readFileSync(path.join(ENGINE_DIR, 'data', 'config', 'private.pem'), 'utf8');
const jwk = createPublicKey(pem).export({ format: 'jwk' });
const rsaN = BigInt('0x' + Buffer.from(jwk.n, 'base64url').toString('hex'));
const rsaE = BigInt('0x' + Buffer.from(jwk.e, 'base64url').toString('hex'));

function modPow(base, exp, mod) {
    let res = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0n) {
        if (e & 1n) res = (res * b) % mod;
        e >>= 1n;
        b = (b * b) % mod;
    }
    return res;
}

class Isaac {
    constructor(seed) {
        this.rsl = new Int32Array(256);
        this.mem = new Int32Array(256);
        this.aa = 0;
        this.bb = 0;
        this.cc = 0;
        this.count = 0;
        for (let i = 0; i < seed.length; i++) this.rsl[i] = seed[i];
        this.init();
    }
    init() {
        let a = 0x9e3779b9 | 0, b = a, c = a, d = a, e = a, f = a, g = a, h = a;
        const mix = () => {
            a ^= b << 11; d = (d + a) | 0; b = (b + c) | 0;
            b ^= c >>> 2; e = (e + b) | 0; c = (c + d) | 0;
            c ^= d << 8;  f = (f + c) | 0; d = (d + e) | 0;
            d ^= e >>> 16; g = (g + d) | 0; e = (e + f) | 0;
            e ^= f << 10; h = (h + e) | 0; f = (f + g) | 0;
            f ^= g >>> 4; a = (a + f) | 0; g = (g + h) | 0;
            g ^= h << 8;  b = (b + g) | 0; h = (h + a) | 0;
            h ^= a >>> 9; c = (c + h) | 0; a = (a + b) | 0;
        };
        for (let i = 0; i < 4; i++) mix();
        for (let i = 0; i < 256; i += 8) {
            a = (a + this.rsl[i]) | 0; b = (b + this.rsl[i + 1]) | 0;
            c = (c + this.rsl[i + 2]) | 0; d = (d + this.rsl[i + 3]) | 0;
            e = (e + this.rsl[i + 4]) | 0; f = (f + this.rsl[i + 5]) | 0;
            g = (g + this.rsl[i + 6]) | 0; h = (h + this.rsl[i + 7]) | 0;
            mix();
            this.mem[i] = a; this.mem[i + 1] = b; this.mem[i + 2] = c; this.mem[i + 3] = d;
            this.mem[i + 4] = e; this.mem[i + 5] = f; this.mem[i + 6] = g; this.mem[i + 7] = h;
        }
        for (let i = 0; i < 256; i += 8) {
            a = (a + this.mem[i]) | 0; b = (b + this.mem[i + 1]) | 0;
            c = (c + this.mem[i + 2]) | 0; d = (d + this.mem[i + 3]) | 0;
            e = (e + this.mem[i + 4]) | 0; f = (f + this.mem[i + 5]) | 0;
            g = (g + this.mem[i + 6]) | 0; h = (h + this.mem[i + 7]) | 0;
            mix();
            this.mem[i] = a; this.mem[i + 1] = b; this.mem[i + 2] = c; this.mem[i + 3] = d;
            this.mem[i + 4] = e; this.mem[i + 5] = f; this.mem[i + 6] = g; this.mem[i + 7] = h;
        }
        this.isaac();
        this.count = 256;
    }
    isaac() {
        this.cc = (this.cc + 1) | 0;
        this.bb = (this.bb + this.cc) | 0;
        for (let i = 0; i < 256; i++) {
            const x = this.mem[i];
            switch (i & 3) {
                case 0: this.aa ^= this.aa << 13; break;
                case 1: this.aa ^= this.aa >>> 6; break;
                case 2: this.aa ^= this.aa << 2; break;
                case 3: this.aa ^= this.aa >>> 16; break;
            }
            this.aa = (this.aa + this.mem[(i + 128) & 0xff]) | 0;
            const y = (this.mem[(x >>> 2) & 0xff] + this.aa + this.bb) | 0;
            this.mem[i] = y;
            this.bb = (this.mem[(y >>> 10) & 0xff] + x) | 0;
            this.rsl[i] = this.bb;
        }
    }
    nextInt() {
        if (this.count-- === 0) {
            this.isaac();
            this.count = 255;
        }
        return this.rsl[this.count];
    }
}

function startBotSession(username, waypoints) {
    let sock = null;
    let isaacOut = null;
    let keepaliveTimer = null;
    let moveTimer = null;
    let wpIdx = 0;

    function sendPacket(opcode, payload = null, varByte = false) {
        if (!sock || sock.destroyed || !isaacOut) return;
        const encOp = (opcode + isaacOut.nextInt()) & 0xff;
        if (!payload || payload.length === 0) {
            sock.write(Buffer.from([encOp]));
            return;
        }
        if (varByte) {
            const out = Buffer.alloc(2 + payload.length);
            out[0] = encOp;
            out[1] = payload.length & 0xff;
            payload.copy(out, 2);
            sock.write(out);
        } else {
            const out = Buffer.alloc(1 + payload.length);
            out[0] = encOp;
            payload.copy(out, 1);
            sock.write(out);
        }
    }

    function sendMoveClick(x, z) {
        const buf = Buffer.alloc(5);
        buf[0] = (x + 128) & 0xff;
        buf[1] = (x >> 8) & 0xff;
        buf[2] = 0; // ctrlHeld = 0 (walk)
        buf[3] = (z + 128) & 0xff;
        buf[4] = (z >> 8) & 0xff;
        sendPacket(28, buf, true); // MOVE_GAMECLICK = 28 (var-byte)
    }

    function connect() {
        sock = net.connect(PORT, HOST, () => {
            sock.write(Buffer.from([14, 0]));
        });

        let stage = 0;
        let buf = Buffer.alloc(0);
        const seed = [11111, 22222, 33333, 44444];

        sock.on('data', chunk => {
            buf = Buffer.concat([buf, chunk]);
            if (stage === 0 && buf.length >= 17) {
                stage = 1;
                buf = buf.subarray(17);

                const pw = 'a';
                const rsaPlain = Buffer.alloc(1 + 16 + 4 + username.length + 1 + pw.length + 1);
                let p = 0;
                rsaPlain.writeUInt8(10, p++);
                rsaPlain.writeUInt32BE(seed[0], p); p += 4;
                rsaPlain.writeUInt32BE(seed[1], p); p += 4;
                rsaPlain.writeUInt32BE(seed[2], p); p += 4;
                rsaPlain.writeUInt32BE(seed[3], p); p += 4;
                rsaPlain.writeUInt32BE(12345, p); p += 4;
                rsaPlain.write(username, p, 'ascii'); p += username.length;
                rsaPlain.writeUInt8(10, p++);
                rsaPlain.write(pw, p, 'ascii'); p += pw.length;
                rsaPlain.writeUInt8(10, p++);

                const m = BigInt('0x' + rsaPlain.toString('hex'));
                const c = modPow(m, rsaE, rsaN);
                let cHex = c.toString(16);
                if (cHex.length % 2 === 1) cHex = '0' + cHex;
                const rsaEnc = Buffer.from(cHex, 'hex');

                const loginPayload = Buffer.alloc(1 + 2 + 1 + 9 * 4 + 1 + rsaEnc.length);
                let lp = 0;
                loginPayload.writeUInt8(255, lp++);
                loginPayload.writeUInt16BE(377, lp); lp += 2;
                loginPayload.writeUInt8(0, lp++);
                crcBuf.copy(loginPayload, lp);
                lp += 36;
                loginPayload.writeUInt8(rsaEnc.length, lp++);
                rsaEnc.copy(loginPayload, lp);

                const header = Buffer.from([16, loginPayload.length]);
                sock.write(Buffer.concat([header, loginPayload]));
            } else if (stage === 1 && buf.length >= 1) {
                const reply = buf[0];
                stage = 2;
                buf = Buffer.alloc(0);
                console.log(`[FamilyCompanion] ${username} login reply=${reply}`);
                if (reply === 2 || reply === 15) {
                    isaacOut = new Isaac(seed);
                    keepaliveTimer = setInterval(() => {
                        sendPacket(40); // NO_TIMEOUT = 40
                    }, 3000);
                    moveTimer = setInterval(() => {
                        const [wx, wz] = waypoints[wpIdx % waypoints.length];
                        wpIdx++;
                        sendMoveClick(wx, wz);
                    }, 4800);
                }
            } else if (stage === 2) {
                // Drain incoming server packets so TCP window never fills
                buf = Buffer.alloc(0);
            }
        });

        sock.on('close', () => {
            if (keepaliveTimer) clearInterval(keepaliveTimer);
            if (moveTimer) clearInterval(moveTimer);
            isaacOut = null;
            setTimeout(connect, 5000);
        });

        sock.on('error', () => {
            // handled by close
        });
    }

    connect();
}

startBotSession('Fred', [
    [3233, 3217],
    [3231, 3218],
    [3232, 3220],
    [3234, 3219]
]);

startBotSession('George', [
    [3234, 3218],
    [3236, 3217],
    [3235, 3215],
    [3233, 3216]
]);
