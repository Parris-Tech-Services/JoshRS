import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['mobile',{width:390,height:844}]]) {
  const page=await browser.newPage({viewport,isMobile:label==='mobile',hasTouch:label==='mobile'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://localhost:8888/rs2.cgi');
  assert.equal(response.status(),200);
  await page.locator('canvas#canvas').waitFor({state:'visible'});
  await page.waitForTimeout(20000);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`full-world-${label}.png`,fullPage:true});
  await page.close();
 }
} finally {await browser.close();}
// Client rendering only: not evidence of login, tutorial completion or save recovery.
