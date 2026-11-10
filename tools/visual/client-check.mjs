#!/usr/bin/env node
// Layer 3: drive the real 274 browser client through quest checkpoints and catch what only the client
// shows: a black (missing) map region, a client crash or console error, and what each place looks like.
//
//   node tools/visual/client-check.mjs <checkpoints.json> [--url http://localhost:8888/rs2.cgi]
//        [--user qa_bot] [--out dir]
//
// Prerequisite: a seeded account (tools/questops/playtest/seed-account.ts), so login skips character
// design. Use the dev world; the account needs staff level 4 for ::tele, which dev worlds grant
// (LoginThread: !production -> staffmodlevel 4).
//
// Click positions come from Client-TS 274 (Client.ts titleScreenLoop): the 360x200 title box is drawn at
// (202,171) on the 765x503 canvas; "Existing User" sits at box (260,140), "Login" at box (100,170).
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { teleCommand, viewportStats, blackVerdict, validateCheckpoints } from './client-check-lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const file = args.find((a) => a.endsWith('.json'));
if (!file) { console.error('usage: client-check.mjs <checkpoints.json> [--url ..] [--user ..] [--out dir]'); process.exit(2); }
const plan = JSON.parse(readFileSync(file, 'utf8'));
const errs = validateCheckpoints(plan);
if (errs.length) { for (const e of errs) console.log(`INVALID ${e}`); process.exit(2); }

const url = opt('--url', 'http://localhost:8888/rs2.cgi');
const user = opt('--user', 'qa_bot');
const out = opt('--out', 'client-check-out');
if (/elrothiro/i.test(user)) { console.error('refusing to log in as an Elrothiro account'); process.exit(2); }
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
const canvas = page.locator('canvas').first();
await canvas.waitFor({ timeout: 30000 });
const box = await canvas.boundingBox();
// Canvas pixels -> page pixels (the canvas may be scaled by CSS).
const dims = await page.evaluate(() => { const c = document.querySelector('canvas'); return { w: c.width, h: c.height }; });
const at = (x, y) => ({ x: box.x + (x / dims.w) * box.width, y: box.y + (y / dims.h) * box.height });
const click = async (x, y) => { const p = at(x, y); await page.mouse.click(p.x, p.y); };

async function pixels() {
    return page.evaluate(() => {
        const c = document.querySelector('canvas');
        // The client may draw with WebGL or 2D; copy through a 2D canvas either way.
        const t = document.createElement('canvas'); t.width = c.width; t.height = c.height;
        const g = t.getContext('2d'); g.drawImage(c, 0, 0);
        return { w: t.width, h: t.height, data: Array.from(g.getImageData(0, 0, t.width, t.height).data) };
    });
}
async function shot(name) {
    const p = join(out, `${name}.png`);
    await canvas.screenshot({ path: p });
    return p;
}

// Title screen loads its assets first; wait until it has drawn something non-black.
for (let i = 0; i < 60; i++) { const s = viewportStats(await pixels(), { x: 0, y: 0, w: 765, h: 503 }); if (s.dark < 0.9) break; await page.waitForTimeout(1000); }
await click(202 + 260, 171 + 140);                       // Existing User
await page.waitForTimeout(500);
await page.keyboard.type(user, { delay: 40 });
await page.keyboard.press('Enter');                       // username -> password
await page.keyboard.type('qa', { delay: 40 });            // dev worlds accept any password for a save on disk
await click(202 + 100, 171 + 170);                        // Login
await page.waitForTimeout(8000);
const loginShot = await shot('00-login');
// In game, the 3D view (512x334 at 4,4) shows the world; the design screen or a failed login does not.
const loginView = viewportStats(await pixels(), { x: 4, y: 4, w: 512, h: 334 });
if (loginView.dark > 0.97) { console.log(`FAIL login: viewport is blank after login (see ${loginShot}). Was the account seeded?`); await browser.close(); process.exit(1); }
console.log(`PASS login as ${user} (${loginShot})`);

let failed = 0;
for (const [i, cp] of plan.checkpoints.entries()) {
    const label = `${String(i + 1).padStart(2, '0')}-${cp.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
    const before = problems.length;
    // In game, typed keys go to the chat input; no click needed (a click on the world would walk).
    await page.keyboard.type(teleCommand(cp), { delay: 25 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(cp.waitMs ?? 6000);         // map load + draw
    const p = await shot(label);
    const v = blackVerdict(viewportStats(await pixels(), { x: 4, y: 4, w: 512, h: 334 }), cp.allowDark);
    const newProblems = problems.slice(before);
    if (v.black || newProblems.length) {
        failed++;
        console.log(`FAIL ${label} ${teleCommand(cp)}\n    ${v.black ? `viewport ${Math.round(v.dark * 100)}% black: missing map region or not loaded` : ''}${newProblems.map((x) => `\n    ${x}`).join('')}\n    screenshot: ${p}`);
    } else {
        console.log(`PASS ${label} ${teleCommand(cp)} (dark ${Math.round(v.dark * 100)}%) ${p}`);
    }
}
writeFileSync(join(out, 'report.json'), JSON.stringify({ user, url, failed, problems }, null, 2));
await browser.close();
console.log(failed ? `\nFAILED: ${failed} checkpoint(s)` : '\nALL PASSED');
process.exit(failed ? 1 : 0);
