import {chromium} from "playwright";
const targets=["https://2004.lostcity.rs/detail","https://2004.lostcity.rs/serverlist?hires.x=1&method=0","https://www.lostcitylabs.com/play"];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
  for(const url of targets){
    console.log("PROBE_URL",url);
    try{
      const res=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(15000)});
      console.log("PROBE_HEADERS",JSON.stringify({status:res.status,url:res.url,frame:res.headers.get("x-frame-options"),csp:res.headers.get("content-security-policy"),type:res.headers.get("content-type")}));
    }catch(e){console.log("PROBE_FETCH_ERROR",String(e))}
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];page.on("console",m=>{if(m.type()==="error")errors.push(m.text().slice(0,500))});
    page.on("pageerror",e=>errors.push(String(e)));
    try{
      await page.goto("https://joshrs.vercel.app/",{waitUntil:"domcontentloaded",timeout:25000});
      await page.evaluate(url=>{const frame=document.createElement("iframe");frame.id="probe-iframe";frame.src=url;frame.style.width="100%";frame.style.height="600px";document.body.append(frame)},url);
      await page.waitForTimeout(5000);
      const frame=page.frameLocator("#probe-iframe");
      let title="";try{title=await frame.locator("body").innerText({timeout:3000});}catch(e){title="FRAME_INACCESSIBLE:"+String(e).slice(0,160)}
      console.log("PROBE_RESULT",JSON.stringify({url,frameUrl:page.frames().at(-1)?.url(),content:title.slice(0,350),errors:errors.slice(0,5)}));
    }catch(e){console.log("PROBE_BROWSER_ERROR",String(e))}
    finally{await page.close()}
  }
}finally{await browser.close()}
