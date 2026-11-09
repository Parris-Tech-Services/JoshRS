// Closed-loop visual capture of the rev-274 browser client.
//
// The agent on this project cannot see images: `screencap` is denied on the phone, the image
// viewer fails on every path, and no browser ships for Termux. So capture happens in CI and the
// screen is converted to TEXT with OCR. This script closes the loop: it OCRs inside its own
// decision loop, so it can wait for a specific screen instead of guessing a fixed delay.
//
// Usage:
//   node visual-capture.mjs <url> <outPng> [--wait-for <regex>] [--max-seconds N]
//
// Prints one OCR line per poll so the CI log is a readable transcript of what the client did.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const url = args[0] ?? 'http://127.0.0.1:8888/rs2.cgi';
const out = args[1] ?? 'login.png';
const waitForIdx = args.indexOf('--wait-for');
const waitFor = waitForIdx >= 0 ? new RegExp(args[waitForIdx + 1], 'i') : /username|password|new user|existing user/i;
const maxIdx = args.indexOf('--max-seconds');
const maxSeconds = maxIdx >= 0 ? Number(args[maxIdx + 1]) : 420;

const canvasPath = out.replace(/\.png$/, '-canvas.png');
const ocrInput = out.replace(/\.png$/, '-ocr-input.png');

/** OCR a PNG via tesseract; returns trimmed text (empty string on failure). */
function ocr(pngPath) {
    try {
        // 2x upscale: the client uses small bitmap fonts that tesseract misses at native size.
        execFileSync('python3', ['-c',
            "import sys;from PIL import Image;img=Image.open(sys.argv[1]).convert('L');" +
            "img.resize((img.width*2,img.height*2),Image.LANCZOS).save(sys.argv[2])",
            pngPath, ocrInput], { stdio: 'pipe' });
        return execFileSync('tesseract', [ocrInput, 'stdout', '--psm', '6'],
            { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8').trim();
    } catch (e) {
        return `OCR_FAILED: ${String(e).slice(0, 120)}`;
    }
}

const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const consoleLines = [];
page.on('console', (m) => consoleLines.push(`${m.type()}: ${m.text()}`.slice(0, 160)));
page.on('pageerror', (e) => consoleLines.push(`pageerror: ${String(e).slice(0, 160)}`));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('canvas', { timeout: 30000 });
await page.waitForTimeout(2000);

// A click starts the cache download; the client otherwise waits on its title screen.
const box = await page.locator('canvas').first().boundingBox();
if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1500);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function snapshot() {
    const dataUrl = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        return c ? c.toDataURL('image/png') : null;
    });
    if (!dataUrl) throw new Error('canvas disappeared');
    writeFileSync(canvasPath, Buffer.from(dataUrl.split(',')[1], 'base64'));
    await page.screenshot({ path: out });
    return ocr(canvasPath);
}

let matched = false;
let lastText = '';
const start = Date.now();
for (let poll = 1; Date.now() - start < maxSeconds * 1000; poll++) {
    lastText = await snapshot();
    const flat = lastText.replace(/\s+/g, ' ').slice(0, 220);
    console.log(`poll ${poll} t=${Math.round((Date.now() - start) / 1000)}s: ${JSON.stringify(flat)}`);
    if (waitFor.test(lastText)) {
        console.log(`MATCHED after ${Math.round((Date.now() - start) / 1000)}s on ${waitFor}`);
        matched = true;
        break;
    }
    await page.waitForTimeout(10000);
}

// One extra capture at rest, so the saved PNG matches the text that was reported.
const finalText = await snapshot();
console.log('--- final OCR ---');
console.log(finalText || '(empty)');
console.log('--- end OCR ---');
if (consoleLines.length) {
    console.log(`console lines: ${consoleLines.length}`);
    for (const l of consoleLines.slice(0, 8)) console.log(`  ${l}`);
}
await browser.close();

if (!matched) {
    console.log(`NO MATCH for ${waitFor} within ${maxSeconds}s`);
    process.exit(2);
}
