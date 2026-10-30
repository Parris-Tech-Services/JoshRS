#!/usr/bin/env node
// Original JoshRS revision-377 save verifier, based on public Engine-TS 377-wip
// PlayerLoading.verify(): magic 0x2004, max version 7, trailing IEEE CRC-32.
// Read-only. Does not decode account secrets, edit saves or access the game server.
import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const NAMES=['Attack','Defence','Strength','Hitpoints','Ranged','Prayer','Magic','Cooking','Woodcutting','Fletching','Fishing','Firemaking','Crafting','Smithing','Mining','Herblore','Agility','Thieving','Slayer','Farming','Runecraft']
const TABLE=Array.from({length:256},(_,idx)=>{
 let n=idx
 for(let i=0;i<8;i++)n=n&1?(n>>>1)^0xedb88320:n>>>1
 return n>>>0
})
export function crc32(bytes) {
 let crc=0xffffffff
 for(const value of bytes)crc=TABLE[(crc^value)&255]^(crc>>>8)
 return (crc^0xffffffff)>>>0
}
export function inspectSave(data){
 const b=Buffer.from(data)
 if(b.length<137)throw Error('Save too short to contain a revision-377 player record')
 const magic=b.readUInt16BE(0),version=b.readUInt16BE(2)
 if(magic!==0x2004)throw Error('Invalid Lost City save header (0x2004 expected)')
 if(version<2||version>7)throw Error('Save version is not supported by this verifier')
 const stored=b.readUInt32BE(b.length-4),calculated=crc32(b.subarray(0,b.length-4))
 if(stored!==calculated)throw Error('Player save CRC-32 failed: do not restore this file')
 const ticks=b.readInt32BE(24),x=b.readUInt16BE(4),z=b.readUInt16BE(6),plane=b.readUInt8(8)
 const skills=[]
 for(let i=0;i<21;i++){
  const offset=28+i*5
  const xp=b.readInt32BE(offset),currentLevel=b.readUInt8(offset+4)
  if(xp<0)throw Error('Invalid negative skill XP; save may be damaged')
  skills.push({skill:NAMES[i],xp,currentLevel})
 }
 return {
  format:'Lost City / JoshRS 377',valid:true,magic:'0x2004',version,
  bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex'),
  crc32:calculated.toString(16).padStart(8,'0'),position:{x,z,plane},
  playtimeTicks:ticks,totalSkillXP:skills.reduce((sum,x)=>sum+x.xp,0),
  skills
 }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2)
 if(args.length!==1){console.error('Usage: node inspect-save.mjs path/to/elrothiro.sav');process.exitCode=2}
 else{
  try{
   const value=inspectSave(fs.readFileSync(args[0]))
   console.log(JSON.stringify(value,null,2))
  }catch(error){console.error('Save validation failed: '+error.message);process.exitCode=1}
 }
}
