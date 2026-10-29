// Browser acceptance against the ORIGINAL locally served game, not an external MMO.
// No paid hosting, upstream credentials or third-party assets.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {makeState} from '../core.mjs';
const paths=new Map([['/woodlands.html','text/html'],['/app.mjs','text/javascript'],['/core.mjs','text/javascript'],['/style.css','text/css']]);
const server=createServer(async(req,res)=>{
 const p=(req.url||'').split('?')[0];
 if(!paths.has(p)){res.writeHead(404);res.end('not found');return}
 try{const bytes=await readFile(new URL('..'+p,import.meta.url));res.writeHead(200,{'Content-Type':paths.get(p),'Cache-Control':'no-store'});res.end(bytes)}
 catch{res.writeHead(500);res.end('file error')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [device,viewport] of [['desktop',{width:1280,height:800}],['mobile',{width:375,height:812}]]){
  const context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile',acceptDownloads:true});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const saved=makeState();saved.x=17;saved.y=12;saved.bag.logs=7;saved.bag.ore=2;
  await page.addInitScript(value=>localStorage.setItem('joshrs-woodlands-v1',value),JSON.stringify(saved));
  const response=await page.goto(origin+'/woodlands.html',{waitUntil:'networkidle'});
  assert.equal(response.status(),200);await page.locator('#world').waitFor({state:'visible'});
  assert.equal(await page.locator('#quest-list .task').count(),5);
  assert.equal(await page.locator('#skills-list .skill').count(),6);
  await page.locator('#tab-town').click();
  assert.equal(await page.locator('#deposit-btn').isEnabled(),true);
  assert.equal(await page.locator('#buy-meal-btn').isDisabled(),true);
  await page.locator('#deposit-btn').click();
  assert.match(await page.locator('#bank-summary').innerText(),/Oak logs: 7/);
  await page.locator('#withdraw-btn').click();
  assert.match(await page.locator('#bank-summary').innerText(),/Oak logs: 0/);
  await page.locator('#deposit-btn').click();
  await page.locator('#tab-guide').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#export-save-btn').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/woodlands-save\.json$/);
  const exported=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(exported.bank.logs,7);
  assert.equal(exported.bag.logs,0);
  page.on('dialog',dialog=>dialog.accept().catch(()=>{}));
  await page.locator('#reset-btn').click();
  await page.locator('#tab-town').click();
  assert.match(await page.locator('#bank-summary').innerText(),/Oak logs: 0/);
  
  await page.locator('#import-save-file').setInputFiles({name:'woodlands-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
  await page.waitForFunction(()=>document.querySelector('#bank-summary')?.textContent?.includes('Oak logs: 7'));
  await page.locator('#import-save-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('not-json')});
  await page.waitForFunction(()=>document.querySelector('#message')?.textContent?.includes('Invalid save'));
  assert.match(await page.locator('#bank-summary').innerText(),/Oak logs: 7/);
  const merchant=makeState();merchant.x=19;merchant.y=12;merchant.questClaimed=true;
  merchant.bag.logs=3;merchant.bag.ore=1;merchant.bag.cooked=1;
  await page.evaluate(value=>localStorage.setItem('joshrs-woodlands-v1',value),JSON.stringify(merchant));
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#tab-town').click();
  assert.equal(await page.locator('#buy-meal-btn').isEnabled(),true);
  await page.locator('#order-btn').click();
  assert.match(await page.locator('#order-progress').innerText(),/Delivered: 1/);
  assert.equal(await page.locator('#gold').innerText(),'100');
  await page.locator('#sell-logs-btn').click();
  assert.equal(await page.locator('#gold').innerText(),'103');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,device+' overflow '+overflow);
  assert.deepEqual(errors,[],device+' browser errors');
  console.log(device+' independently hosted original-game bank/trade/save acceptance PASS');
  await context.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
