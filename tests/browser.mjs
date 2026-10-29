import assert from "node:assert/strict";
import {chromium} from "playwright";
const URL=process.env.JOSHRS_URL||"https://joshrs.vercel.app/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const [label,viewport] of [["desktop",{width:1440,height:900}],["mobile",{width:375,height:812}]]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1,isMobile:label==="mobile",hasTouch:label==="mobile"});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  let res=await page.goto(URL,{waitUntil:"networkidle",timeout:45000});
  assert.equal(res?.status(),200,label+" launcher returned non-200 response");
  assert.match(await page.title(),/JoshRS/);
  const play=page.locator('a.cta');
  assert.equal(await play.getAttribute("href"),"https://2004.lostcity.rs/detail");
  assert.match(await play.innerText(),/full 2004Scape/i);
  assert.match(await page.locator(".important").innerText(),/external website/i);
  assert.ok(await page.locator(".scene").isVisible());
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,label+" launcher has horizontal overflow: "+overflow);
  const shortcut=await page.request.get(new globalThis.URL("/play",URL).href,{maxRedirects:0});
  assert.ok([301,302,307,308].includes(shortcut.status()),"Play shortcut is not a redirect: "+shortcut.status());
  assert.equal(shortcut.headers().location,"https://2004.lostcity.rs/detail");
  res=await page.goto(new globalThis.URL("/woodlands.html",URL).href,{waitUntil:"networkidle",timeout:45000});
  assert.equal(res?.status(),200,label+" Woodlands returned non-200");
  await page.locator("#world").waitFor({state:"visible",timeout:15000});
  const canvas=page.locator("#world"),box=await canvas.boundingBox();
  assert.ok(box&&box.width>200&&box.height>120,label+" game canvas not visible");
  assert.equal(await page.locator("#quest-list .task").count(),5);
  assert.equal(await page.locator("#skills-list .skill").count(),6);
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,label+" Woodlands has horizontal overflow: "+overflow);
  if(label==="desktop"){
    await canvas.click({position:{x:box.width*(208/800),y:box.height*(144/512)}});
    await page.waitForFunction(()=>document.querySelector("#message")?.textContent?.includes("You chop oak logs"),{timeout:10000}).catch(async()=>{throw Error("tree interaction did not complete: "+await page.locator("#message").innerText())});
    await page.locator("#tab-inventory").click();
    assert.equal(await page.locator("#panel-inventory").isVisible(),true);
    await page.locator("#light-btn").click();
    assert.match(await page.locator("#message").innerText(),/campfire/i);
  }else{
    await page.locator('[data-step="0,-1"]').tap();
    assert.equal(await page.locator("#coords").innerText(),"18, 12","touch move failed");
    await page.locator("#tab-guide").tap();
    assert.equal(await page.locator("#panel-guide").isVisible(),true);
  }
  assert.deepEqual(errors,[],label+" JavaScript errors");
  await page.screenshot({path:"joshrs-"+label+".png",fullPage:true});
  console.log(label+" PASS",URL);
  await page.close();
 }
}finally{await browser.close()}
