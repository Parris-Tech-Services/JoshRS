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

// Any unexpected failure must explain itself. Without this, the process exits and the shell step
// fails with nothing but the last log line, which is what made the post-login crash invisible.
process.on('uncaughtException', (e) => {
    console.error(`UNCAUGHT: ${e?.stack ?? String(e)}`);
    process.exit(3);
});
process.on('unhandledRejection', (e) => {
    console.error(`UNHANDLED: ${e?.stack ?? String(e)}`);
    process.exit(3);
});

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
// Some targets have no OCR-able label: the side tab strip is icons only. A coordinate sweep turns
// an unreadable icon into an addressable one - click, OCR, stop when the expected panel appears.
// Reading the canvas as a coarse brightness grid makes UI structure visible in a text log: the tab
// strip, chat buttons and backdrop have distinct signatures, which beats guessing coordinates.
// The engine autosaves every 1500 ticks (15 min) and on logout, so a short session leaves no file.
// Logging out is what makes a save observable without waiting a quarter of an hour.
const doLogout = args.includes('--logout');
const dumpGrid = args.includes('--dump-grid');
const tabSearch = args.includes('--tab-search');
const tabExpectIdx = args.indexOf('--tab-expect');
const tabExpect = new RegExp(tabExpectIdx >= 0 ? args[tabExpectIdx + 1] : 'quest', 'i');
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
if (tabSearch) {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    const dims = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        return c ? { w: c.width, h: c.height } : null;
    });
    if (box && dims) {
        const toPage = (cx, cy) => [box.x + (cx / dims.w) * box.width, box.y + (cy / dims.h) * box.height];
        // From the canvas grid the sidebar begins near x=520 and the tab icons sit in a narrow
        // column just inside it; an earlier sweep started at x=700 and only ever clicked sidebar
        // content, which is why it found nothing.
        const xs = [522, 530, 538, 546];
        let found = null;
        outer: for (const cx of xs) {
            for (let cy = 70; cy <= 330; cy += 10) {
                const [px, py] = toPage(cx, cy);
                await page.mouse.click(px, py);
                await page.waitForTimeout(900);
                let text = '';
                try { text = await snapshot(); } catch { continue; }
                if (tabExpect.test(text)) {
                    found = { cx, cy, text: text.replace(/\s+/g, ' ').slice(0, 160) };
                    console.log(`TAB FOUND at canvas(${cx},${cy}): ${JSON.stringify(found.text)}`);
                    break outer;
                }
            }
        }
        if (!found) console.log('TAB SEARCH: no coordinate produced the expected panel');
        else console.log('TAB COORDINATE:', JSON.stringify({ x: found.cx, y: found.cy }));
    }
}

let matched = false;
let lastText = '';
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

    // A brand-new account lands on character design, not in the world. There is no sidebar there,
    // so every tab click afterwards would hit nothing - which is exactly what the tab sweep saw.
    let afterLogin = '';
    try { afterLogin = await snapshot(); } catch { /* canvas may be mid-swap */ }
    if (/design your player|design colour|gender/i.test(afterLogin)) {
        console.log('character design detected; completing it');
        let clicked = false;
        // Some clients accept the starting appearance with a key press rather than a button.
        for (const key of ['Enter', 'Escape', 'Space']) {
            await page.keyboard.press(key);
            await page.waitForTimeout(1500);
            let t = '';
            try { t = await snapshot(); } catch { continue; }
            if (!/design your player|design colour|gender/i.test(t)) {
                console.log(`design advanced by key ${key}`);
                clicked = true;
                break;
            }
        }
        for (const re of [/^accept$/i, /^confirm$/i, /^continue$/i, /^done$/i, /^create$/i, /^looks good$/i]) {
            if (await clickField(re)) { clicked = true; break; }
        }
        if (!clicked) {
            // Targeted sweep of the lower-centre region, where a design confirm button sits. This is
            // a small area (not the whole canvas), so it is cheap and each click is checked.
            const cbox = await page.locator('canvas').first().boundingBox();
            const cdims = await page.evaluate(() => {
                const c = document.querySelector('canvas');
                return c ? { w: c.width, h: c.height } : null;
            });
            if (cbox && cdims) {
                // (0.40, 0.55) is where a previous sweep advanced past design; try it first.
                const known = [[0.40, 0.55]];
                for (const [kx, ky] of known) {
                    await page.mouse.click(cbox.x + kx * cbox.width, cbox.y + ky * cbox.height);
                    await page.waitForTimeout(1800);
                    let t = '';
                    try { t = await snapshot(); } catch { continue; }
                    if (!/design your player|design colour|gender/i.test(t)) {
                        console.log(`design advanced by known click (${kx}, ${ky})`);
                        clicked = true;
                        break;
                    }
                }
                outerDesign: for (let fy = 0.55; fy <= 0.95 && !clicked; fy += 0.08) {
                    for (let fx = 0.30; fx <= 0.70; fx += 0.10) {
                        await page.mouse.click(cbox.x + fx * cbox.width, cbox.y + fy * cbox.height);
                        await page.waitForTimeout(1200);
                        let t = '';
                        try { t = await snapshot(); } catch { continue; }
                        if (!/design your player|design colour|gender/i.test(t)) {
                            console.log(`design advanced by clicking (${fx.toFixed(2)}, ${fy.toFixed(2)})`);
                            clicked = true;
                            break outerDesign;
                        }
                    }
                }
                if (!clicked) console.log('design sweep found no confirm control');
            }
        }
        if (!clicked) {
            // No labelled control: try the bottom-centre band where a confirm button normally sits.
            const cb = await page.locator('canvas').first().boundingBox();
            const dims = await page.evaluate(() => {
                const c = document.querySelector('canvas');
                return c ? { w: c.width, h: c.height } : null;
            });
            if (cb && dims) {
                for (const frac of [0.90, 0.84, 0.78]) {
                    const px = cb.x + 0.5 * cb.width;
                    const py = cb.y + frac * cb.height;
                    await page.mouse.click(px, py);
                    await page.waitForTimeout(2500);
                    let t = '';
                    try { t = await snapshot(); } catch { continue; }
                    const stillDesign = /design your player|design colour/i.test(t);
                    console.log(`bottom-centre click at ${frac} -> ${stillDesign ? 'still on design' : 'advanced'}`);
                    if (!stillDesign) break;
                }
            }
        }
        await page.waitForTimeout(6000);
        try {
            const after = await snapshot();
            console.log(`post-design screen: ${JSON.stringify(after.replace(/\s+/g, ' ').slice(0, 140))}`);
        } catch { /* ignore */ }
    }
}


    try {
        lastText = await snapshot();
    } catch (e) {
        // The client can replace its canvas mid-transition; that is not a verification failure,
        // so keep polling until the deadline instead of throwing.
        console.log(`poll ${poll}: canvas unavailable during transition (${String(e).slice(0, 80)})`);
        await page.waitForTimeout(5000);
        continue;
    }
    const flat = lastText.replace(/\s+/g, ' ').slice(0, 220);
    console.log(`poll ${poll} t=${Math.round((Date.now() - start) / 1000)}s: ${JSON.stringify(flat)}`);
    if (waitFor.test(lastText)) {
        console.log(`MATCHED after ${Math.round((Date.now() - start) / 1000)}s on ${waitFor}`);
        matched = true;
        break;
    }
    await page.waitForTimeout(10000);
}

// One extra capture at rest, so the saved PNG matches the text that was reported. The client can
// replace its canvas when it transitions into the game, so this must not throw after a success.
let finalText = '';
try {
    finalText = await snapshot();
} catch (e) {
    finalText = `(final capture skipped: ${String(e).slice(0, 120)})`;
}
console.log('--- final OCR ---');
console.log(finalText || '(empty)');
console.log('--- end OCR ---');
if (consoleLines.length) {
    console.log(`console lines: ${consoleLines.length}`);
    for (const l of consoleLines.slice(0, 8)) console.log(`  ${l}`);
}
if (doLogout) {
    // "LOG" is drawn on the game frame and is OCR-visible in the world.
    const logged = (await clickWord(page, /^log$/i)) || (await clickWord(page, /logout/i));
    console.log(logged ? 'clicked LOG' : 'could not locate the LOG button');
    await page.waitForTimeout(6000);
}

if (dumpGrid) {
    const grid = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        if (!c) return null;
        const ctx = c.getContext('2d');
        const W = 76, H = 38;
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const out = [];
        for (let gy = 0; gy < H; gy++) {
            let row = '';
            for (let gx = 0; gx < W; gx++) {
                const x0 = Math.floor(gx * c.width / W), x1 = Math.floor((gx + 1) * c.width / W);
                const y0 = Math.floor(gy * c.height / H), y1 = Math.floor((gy + 1) * c.height / H);
                let sum = 0, n = 0;
                for (let y = y0; y < y1; y += 2) {
                    for (let x = x0; x < x1; x += 2) {
                        const i = (y * c.width + x) * 4;
                        sum += (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
                        n++;
                    }
                }
                const v = n ? sum / n : 0;
                row += v > 200 ? '#' : v > 150 ? '+' : v > 100 ? '-' : v > 55 ? '.' : ' ';
            }
            out.push(row);
        }
        return { rows: out, w: c.width, h: c.height };
    });
    if (grid) {
        console.log(`--- canvas grid ${grid.w}x${grid.h} (76x38 cells; '#' bright, ' ' dark) ---`);
        grid.rows.forEach((r, i) => console.log(`${String(i).padStart(2)}|${r}|`));
        console.log('--- end grid ---');
    }
}

await browser.close();

if (!matched) {
    console.log(`NO MATCH for ${waitFor} within ${maxSeconds}s`);
    process.exit(2);
}
