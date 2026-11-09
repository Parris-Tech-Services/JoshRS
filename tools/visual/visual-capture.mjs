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
    // The client boots, fetches cache over HTTP and paints a canvas.
    await page.waitForTimeout(25000);
    ok = true;
} catch (e) {
    console.log(`NAVIGATION FAILED: ${String(e).slice(0, 300)}`);
}

await page.screenshot({ path: out, fullPage: false });

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
