import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'

test('sandbox client patch corrects real upstream bug without overwriting source or copying test key',()=>{
 const src=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-web377-src-'))
 const root=path.resolve(import.meta.dirname,'../../..')
 const outRoot=path.join(root,'runtime')
 fs.mkdirSync(outRoot,{recursive:true})
 const out=path.join(outRoot,'probe-'+process.pid)
 fs.rmSync(out,{recursive:true,force:true})
 try{
  fs.mkdirSync(path.join(src,'osrs/net'),{recursive:true})
  const bad='const x = ()=>{this.client.send(bytes.slice);}\n'
  fs.writeFileSync(path.join(src,'osrs/net/Socket.ts'),bad)
  fs.writeFileSync(path.join(src,'osrs/Configuration.ts'),'public static GAME_PORT: number = 43594\npublic static SERVER_ADDRESS: string = "127.0.0.1"')
  fs.writeFileSync(path.join(src,'package.json'),JSON.stringify({name:'webscape'}))
  fs.mkdirSync(path.join(src,'page'),{recursive:true})
  fs.writeFileSync(path.join(src,'page/App.tsx'),'discord -> user\nUse any username/password to log in')
  fs.writeFileSync(path.join(src,'test-rsa.pem'),'DO_NOT_COPY')
  const cmd=new URL('../prepare-client.mjs',import.meta.url).pathname
  const run=spawnSync(process.execPath,[cmd,'--source',src,'--output',out],{encoding:'utf8'})
  assert.equal(run.status,0,run.stderr)
  assert.equal(fs.readFileSync(path.join(src,'osrs/net/Socket.ts'),'utf8'),bad)
  assert.match(fs.readFileSync(path.join(out,'osrs/net/Socket.ts'),'utf8'),/this.client.send\(bytes.slice\(\)\);/)
  assert.match(fs.readFileSync(path.join(out,'page/App.tsx'),'utf8'),/discord -&gt; user/)
  assert.match(fs.readFileSync(path.join(out,'page/App.tsx'),'utf8'),/Never enter your real game credentials/)
  assert.equal(fs.readFileSync(path.join(src,'page/App.tsx'),'utf8'),'discord -> user\nUse any username/password to log in')
  assert.match(fs.readFileSync(path.join(out,'joshrs-asset-types.d.ts'),'utf8'),/declare module '\\*\\.dat'/)
  assert.equal(fs.existsSync(path.join(out,'test-rsa.pem')),false)
  assert.equal(JSON.parse(fs.readFileSync(path.join(out,'JOSHRS_PATCH_REPORT.json'))).playable,false)
  const rerun=spawnSync(process.execPath,[cmd,'--source',src,'--output',out],{encoding:'utf8'})
  assert.notEqual(rerun.status,0,'cannot overwrite existing sandbox')
 }finally{fs.rmSync(src,{recursive:true,force:true});fs.rmSync(out,{recursive:true,force:true})}
})
