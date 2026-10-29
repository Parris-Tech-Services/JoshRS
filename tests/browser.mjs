import assert from "node:assert/strict";
import {chromium} from "playwright";
const URL=process.env.JOSHRS_URL||"https://joshrs.vercel.app/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const [label,viewport] of [["desktop",{width:1440,height:900}],["mobile",{width:375,height:812}]]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1,isMobile:label==="mobile",hasTouch:label==="mobile"});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  const res=await page.goto(URL,{waitUntil:"networkidle",timeout:45000});
  assert.equal(res?.status(),200,label+" returned non-200 HTTP response");
  await page.locator("#world").waitFor({state:"visible",timeout:15000});
  assert.match(await page.title(),/JoshRS/);
  const canvas=page.locator("#world"),box=await canvas.boundingBox();
  assert.ok(box&&box.width>200&&box.height>120,label+" canvas not visible");
  assert.equal(await page.locator("#quest-list .task").count(),5,label+" quest tasks missing");
  assert.equal(await page.locator("#skills-list .skill").count(),6,label+" skills missing");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,label+" has horizontal overflow of "+overflow+"px");
  if(label==="desktop"){
    // Initial player is at 18,13 and camera top-left is 6,5 in the 25x16 viewport.
    // Click the oak at 12,9 and allow auto-pathing + interaction to complete.
    await canvas.click({position:{x:box.width*(208/800),y:box.height*(144/512)}});
    await page.waitForFunction(()=>document.querySelector("#message")?.textContent?.includes("You chop oak logs"),{timeout:10000}).catch(async()=>{throw Error("tree interaction did not complete: "+await page.locator("#message").innerText())});
    assert.equal(await page.locator("#tab-inventory").getAttribute("aria-selected"),"false");
    await page.locator("#tab-inventory").click();
    assert.equal(await page.locator("#panel-inventory").isVisible(),true);
    assert.ok(Number(await page.evaluate(()=>JSON.parse(localStorage.getItem("joshrs-woodlands-v1")).bag.logs))>=1);
    await page.locator("#light-btn").click();
    assert.match(await page.locator("#message").innerText(),/campfire/i);
  }else{
    await page.locator('[data-step="0,-1"]').tap();
    assert.equal(await page.locator("#coords").innerText(),"18, 12","touch movement did not update coords");
    await page.locator("#tab-guide").tap();
    assert.equal(await page.locator("#panel-guide").isVisible(),true);
  }
  assert.deepEqual(errors,[],label+" JavaScript errors");
  await page.screenshot({path:"joshrs-"+label+".png",fullPage:true});
  console.log(label+" PASS",URL);
  await page.close();
 }
}finally{await browser.close()}
