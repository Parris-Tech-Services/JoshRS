// Headless capture of the rev-274 browser client, for text-based visual verification.
//
// Why: this project has no working screenshot path on the phone (`screencap` is denied, the image
// viewer cannot open any path, and no browser is packaged for Termux). Rather than ask for a human
// to look, the client is captured in CI and the capture is converted to TEXT with OCR, which the
// agent can read and assert on.
//
// Usage: node visual-capture.mjs <url> <outPng>
// Prints what it saw and exits non-zero only on a hard failure (page never loaded).
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:8888/rs2.cgi';
const out = process.argv[3] ?? 'login.png';

const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const consoleLines = [];
page.on('console', (m) => consoleLines.push(`${m.type()}: ${m.text()}`.slice(0, 200)));
page.on('pageerror', (e) => consoleLines.push(`pageerror: ${String(e).slice(0, 200)}`));

let ok = false;
try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // The 274 web client paints into an existing canvas; a click is required to start loading.
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(3000);
    const box = await page.locator('canvas').first().boundingBox();
    if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(2000);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    // Poll the canvas itself until it stops being a flat colour (or time out).
    const stats = await page.evaluate(async () => {
        const c = document.querySelector('canvas');
        if (!c) return { error: 'no canvas' };
        const ctx = c.getContext('2d');
        const deadline = Date.now() + 90000;
        let last = null;
        while (Date.now() < deadline) {
            const data = ctx.getImageData(0, 0, c.width, c.height).data;
            const seen = new Set();
            for (let i = 0; i < data.length; i += 4 * 97) {
                seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
            }
            last = { shades: seen.size, w: c.width, h: c.height };
            if (seen.size > 20) return last;
            await new Promise((r) => setTimeout(r, 5000));
        }
        return { ...last, timedOut: true };
    });
    console.log(`canvas stats: ${JSON.stringify(stats)}`);
    ok = true;
} catch (e) {
    console.log(`NAVIGATION FAILED: ${String(e).slice(0, 300)}`);
}

await page.screenshot({ path: out, fullPage: false });

// Save the canvas alone: the game UI lives there, not in the page DOM.
const canvasPng = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return c ? c.toDataURL('image/png') : null;
});
if (canvasPng) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(out.replace(/\.png$/, '-canvas.png'), Buffer.from(canvasPng.split(',')[1], 'base64'));
    console.log(`canvas png: ${out.replace(/\.png$/, '-canvas.png')}`);
}

// Report what the page contained, as text.
const canvases = await page.evaluate(() =>
    Array.from(document.querySelectorAll('canvas')).map((c) => ({ w: c.width, h: c.height }))
);
const bodyText = (await page.evaluate(() => document.body?.innerText ?? '')).slice(0, 500);

console.log(`url: ${url}`);
console.log(`screenshot: ${out}`);
console.log(`canvases: ${JSON.stringify(canvases)}`);
console.log(`body text: ${JSON.stringify(bodyText)}`);
console.log(`console lines: ${consoleLines.length}`);
for (const line of consoleLines.slice(0, 15)) console.log(`  ${line}`);

await browser.close();
process.exit(ok ? 0 : 1);
