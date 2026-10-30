import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {createServer} from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)
  const absolute=path.resolve(root,'.'+pathname)
  if(!absolute.startsWith(root+path.sep)){res.writeHead(403).end();return}
  const data=await fs.readFile(absolute)
  res.writeHead(200,{'Content-Type':mime[path.extname(absolute)]||'application/octet-stream'})
  res.end(data)
 }catch(e){res.writeHead(404).end()}
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const port=server.address().port
const source=['==== MAP ====','0 1 2: h13 o107;2;1 u54','0 3 4: u5','==== LOC ====','0 1 2: 5328 22 2','==== NPC ====','0 3 4: 1698','==== OBJ ====',''].join('\n')
const modified=source.replace('u54','u55').replace('5328','5329')
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
try{
 for(const [name,width,height] of [['desktop',1200,900],['mobile',375,812]]) {
  const page=await browser.newPage({viewport:{width,height}})
  const errors=[];page.on('pageerror',err=>errors.push(String(err)))
  const resp=await page.goto('http://127.0.0.1:'+port+'/map-inspector.html')
  assert.equal(resp.status(),200)
  await page.locator('#base').setInputFiles({name:'m57_55.jm2',mimeType:'text/plain',buffer:Buffer.from(source)})
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Loaded m57_55.jm2'))
  assert.match(await page.locator('#status').innerText(),/Terrain 2, scenery 1, NPCs 1/)
  await page.locator('#compare').setInputFiles({name:'m57_55.jm2',mimeType:'text/plain',buffer:Buffer.from(modified)})
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('1 terrain changes'))
  await page.locator('#floorpack').setInputFiles({name:'flo.pack',mimeType:'text/plain',buffer:Buffer.from('5=water\n54=grass\n')})
  await page.locator('#locpack').setInputFiles({name:'loc.pack',mimeType:'text/plain',buffer:Buffer.from('5328=stone\n')})
  await page.locator('#npcpack').setInputFiles({name:'npc.pack',mimeType:'text/plain',buffer:Buffer.from('1698=guide\n')})
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Unknown floor IDs: 1'))
  await page.locator('#layer').selectOption('diff')
  const box=await page.locator('#grid').boundingBox()
  await page.locator('#grid').click({position:{x:box.width*(1.5/64),y:box.height*(61.5/64)}})
  assert.match(await page.locator('#detail').innerText(),/Different from original: yes/)
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()])
  assert.equal(download.suggestedFilename(),'joshrs-377-map-audit.json')
  assert.equal(await page.locator('#export').isEnabled(),true)
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
  assert.ok(overflow<=2,name+' overflow '+overflow)
  assert.deepEqual(errors,[],name+' JS runtime errors')
  await page.screenshot({path:'joshrs-map-inspector-'+name+'.png',fullPage:true})
  await page.close()
  console.log(name+' map inspector PASS')
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
