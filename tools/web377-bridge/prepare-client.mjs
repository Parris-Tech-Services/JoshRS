#!/usr/bin/env node
// Prepare a PRIVATE disposable client copy; do not write in a submodule or production world.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const argv=process.argv.slice(2)
if(argv.length!==4 || argv[0]!=='--source' || argv[2]!=='--output') {
 console.error('Usage: node prepare-client.mjs --source /path/to/web-client-377 --output /path/to/JoshRS/runtime/web377-sandbox')
 process.exit(2)
}
const repoRoot=path.resolve(import.meta.dirname,'../..')
const source=path.resolve(argv[1]),output=path.resolve(argv[3])
const repoRuntime=path.join(repoRoot,'runtime')+path.sep
if(!output.startsWith(repoRuntime))throw Error('Output must be a new directory within JoshRS/runtime, which is gitignored')
if(!fs.statSync(source).isDirectory())throw Error('Source is not a directory')
if(fs.existsSync(output))throw Error('Output already exists. Refusing overwrite.')
const socket=path.join(source,'osrs/net/Socket.ts')
const cfg=path.join(source,'osrs/Configuration.ts')
const pkg=path.join(source,'package.json')
const src=fs.readFileSync(socket,'utf8'),conf=fs.readFileSync(cfg,'utf8')
assert(src.includes('this.client.send(bytes.slice);'),'Pinned websocket send bug missing or source changed')
assert(conf.includes('public static GAME_PORT: number = 43594'),'Source game port differs from expected 377 web client')
assert(conf.includes('public static SERVER_ADDRESS: string = "127.0.0.1"'),'Source host differs from expected local configuration')
const meta=JSON.parse(fs.readFileSync(pkg,'utf8'))
if(meta.name!=='webscape')throw Error('Unexpected client package; no files copied')
fs.mkdirSync(path.dirname(output),{recursive:true})
fs.cpSync(source,output,{recursive:true,filter:(file)=>{
 const basename=path.basename(file)
 return !['.git','node_modules','.parcel-cache','test-rsa.pem'].includes(basename)
}})
const dst=path.join(output,'osrs/net/Socket.ts')
const before=fs.readFileSync(dst,'utf8')
const fixed=before.replace('this.client.send(bytes.slice);','this.client.send(bytes.slice());')
if(fixed===before)throw Error('No patch applied')
fs.writeFileSync(dst,fixed)
const page=path.join(output,'page/App.tsx')
if(!fs.existsSync(page))throw Error('Pinned React entrypoint is missing')
const originalPage=fs.readFileSync(page,'utf8')
if(!originalPage.includes('discord -> user')||!originalPage.includes('Use any username/password to log in'))throw Error('Pinned React source changed; refusing to silently patch')
const saferPage=originalPage
 .replace('discord -> user','discord -&gt; user')
 .replace('Use any username/password to log in','Local development preview only. Never enter your real game credentials.')
fs.writeFileSync(page,saferPage)
const report={
 kind:'web377-local-sandbox',status:'SOURCE_PATCH_ONLY',playable:false,
 originalSource:source,workingCopy:output,
 fixes:['Repair WebSocket Socket.write$byte_A: send byte slice data, not function','Fix React JSX syntax in the developer contact text','Remove unsafe prototype advice to enter any real account credentials'],
 blockers:['Game TCP relay alone does not prove Apollo/Lost City login protocol compatibility','RSA public modulus must match target engine','Cache/update ports and formats unverified','Actual browser render and multiplayer login unverified'],
 privacy:'Private source sandbox; never commit Jagex client_cache or account data to public JoshRS.'
}
fs.writeFileSync(path.join(output,'JOSHRS_PATCH_REPORT.json'),JSON.stringify(report,null,2)+'\n')
console.log('Prepared local browser-client sandbox (original source unchanged): '+output)
console.log('Login protocol and playable integration remain unverified.')
