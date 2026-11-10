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
const waitFor = waitForIdx >= 0 ? new RegExp(args[waitForIdx + 1], 'i') : /username|password/i;
const maxIdx = args.indexOf('--max-seconds');
const maxSeconds = maxIdx >= 0 ? Number(args[maxIdx + 1]) : 420;
// The credential panel occupies the centre of the 765x503 canvas; cropping removes the
// decorative background whose stray glyphs were being mistaken for field labels.
const LOGIN_CROP = [120, 100, 650, 430];
const loginIdx = args.indexOf('--login');
const login = loginIdx >= 0 ? args[loginIdx + 1] : null; // "user:pass"

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

/** OCR a PNG and return words with boxes in CANVAS pixel coordinates. */
function ocrWords(pngPath, canvasW, canvasH, crop) {
    try {
        const cropArg = crop ? crop.join(',') : '';
        execFileSync('python3', ['-c',
            "import sys;from PIL import Image;img=Image.open(sys.argv[1]).convert('L');" +
            "c=sys.argv[3];" +
            "img=img.crop(tuple(int(v) for v in c.split(','))) if c else img;" +
            "img.resize((img.width*2,img.height*2),Image.LANCZOS).save(sys.argv[2])",
            pngPath, ocrInput, cropArg], { stdio: 'pipe' });
        const tsv = execFileSync('tesseract', [ocrInput, 'stdout', '--psm', '6', 'tsv'],
            { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
        const out = [];
        for (const line of tsv.split('\n').slice(1)) {
            const cols = line.split('\t');
            if (cols.length < 12) continue;
            const word = cols[11];
            if (!word || !word.trim()) continue;
            const ox = crop ? crop[0] : 0, oy = crop ? crop[1] : 0;
            const left = Number(cols[6]) / 2 + ox, top = Number(cols[7]) / 2 + oy;
            const w = Number(cols[8]) / 2, h = Number(cols[9]) / 2;
            if (!Number.isFinite(left) || !Number.isFinite(top)) continue;
            // Canvas pixels; the caller maps to page coordinates.
            out.push({ word, cx: left + w / 2, cy: top + h / 2, canvasW, canvasH });
        }
        return out;
    } catch {
        return [];
    }
}

/** Click the centre of the first word matching `re`. Returns true if clicked. */
async function clickWord(page, re) {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    const dims = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        return c ? { w: c.width, h: c.height } : null;
    });
    if (!box || !dims) return false;

    const words = ocrWords(canvasPath, dims.w, dims.h, null);
    const norm = (w) => w.toLowerCase().replace(/[^a-z]/g, '');
    const hit = words.find((wd) => re.test(wd.word) || re.test(norm(wd.word)));
    if (!hit) {
        console.log(`  (no match; words seen: ${words.slice(0, 12).map((w) => w.word).join(' ')})`);
        return false;
    }

    const px = box.x + (hit.cx / dims.w) * box.width;
    const py = box.y + (hit.cy / dims.h) * box.height;
    await page.mouse.click(px, py);
    console.log(`clicked "${hit.word}" at canvas(${Math.round(hit.cx)},${Math.round(hit.cy)}) -> page(${Math.round(px)},${Math.round(py)})`);
    return true;
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

// Log in when credentials are supplied: the client's fields are canvas-drawn, so each field is
// located by OCR and clicked, then typed into.
// The title screen also shows "New User | Existing User", so matching that string proves nothing.
// Click through to the credential form first, then wait for Username/Password.
let formReached = false;
for (let attempt = 1; attempt <= 6 && !formReached; attempt++) {
    await snapshot();
    if (await clickWord(page, /^existing$/i) || await clickWord(page, /^existing user$/i)) {
        await page.waitForTimeout(6000);
        const check = await snapshot();
        if (/username|password/i.test(check)) {
            formReached = true;
            console.log('login form reached');
        } else {
            console.log('clicked Existing User but form not detected yet; retrying');
        }
    } else {
        console.log('could not locate an "Existing User" button in OCR output');
        await page.waitForTimeout(4000);
    }
}
const start = Date.now();
for (let poll = 1; Date.now() - start < maxSeconds * 1000; poll++) {
if (login) {
    const [user, pass] = login.split(':');
    const clickField = async (re) => {
        const canvas = page.locator('canvas').first();
        const box = await canvas.boundingBox();
        const dims = await page.evaluate(() => {
            const c = document.querySelector('canvas');
            return c ? { w: c.width, h: c.height } : null;
        });
        if (!box || !dims) return false;
        const words = ocrWords(canvasPath, dims.w, dims.h, LOGIN_CROP);
        const norm = (w) => w.toLowerCase().replace(/[^a-z]/g, '');
        const hit = words.find((wd) => re.test(wd.word) || re.test(norm(wd.word)));
        if (!hit) {
            console.log(`  (field not found; saw: ${words.slice(0, 12).map((w) => w.word).join(' ')})`);
            return false;
        }
        await page.mouse.click(box.x + (hit.cx / dims.w) * box.width, box.y + (hit.cy / dims.h) * box.height);
        console.log(`clicked field "${hit.word}" at canvas(${Math.round(hit.cx)},${Math.round(hit.cy)})`);
        return true;
    };

    if (await clickField(/username|sername/i)) {
        await page.keyboard.type(user, { delay: 60 });
        console.log(`typed username (${user.length} chars)`);
    } else {
        console.log('could not locate the username field');
    }
    await page.keyboard.press('Tab');
    await page.keyboard.type(pass, { delay: 60 });
    console.log('typed password');
    await page.waitForTimeout(500);
    const shot = await snapshot();
    console.log(`pre-login screen: ${JSON.stringify(shot.replace(/\s+/g, ' ').slice(0, 120))}`);
    if (!(await clickField(/^login$/i))) {
        console.log('could not locate the Login button');
    } else {
        console.log('clicked Login');
    }
    await page.waitForTimeout(8000);
}

let matched = false;
let lastText = '';

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
