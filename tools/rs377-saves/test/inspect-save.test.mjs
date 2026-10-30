import test from 'node:test'
import assert from 'node:assert/strict'
import {crc32,inspectSave} from '../inspect-save.mjs'
function fixture(){
 const b=Buffer.alloc(137)
 b.writeUInt16BE(0x2004,0);b.writeUInt16BE(7,2)
 b.writeUInt16BE(3216,4);b.writeUInt16BE(3358,6);b.writeUInt8(0,8)
 b.writeInt32BE(17165,24)
 for(let i=0;i<21;i++){b.writeInt32BE(i*1024,28+i*5);b.writeUInt8(i===0?50:1,32+i*5)}
 b.writeUInt32BE(crc32(b.subarray(0,-4)),b.length-4)
 return b
}
test('377 fixture has valid magic/version/CRC and expected skills',()=>{
 const report=inspectSave(fixture())
 assert.equal(report.valid,true)
 assert.equal(report.version,7)
 assert.equal(report.position.x,3216)
 assert.equal(report.playtimeTicks,17165)
 assert.equal(report.skills.length,21)
 assert.equal(report.skills[10].skill,'Fishing')
 assert.equal(report.totalSkillXP,215040)
 assert.match(report.sha256,/^[0-9a-f]{64}$/)
})
test('rejects altered, invalid or truncated save',()=>{
 const x=fixture(),tampered=Buffer.from(x);tampered[40]^=0x01
 assert.throws(()=>inspectSave(tampered),/CRC-32 failed/)
 const badHeader=Buffer.from(x);badHeader.writeUInt16BE(0,0)
 assert.throws(()=>inspectSave(badHeader),/header/)
 const badVersion=Buffer.from(x);badVersion.writeUInt16BE(8,2)
 assert.throws(()=>inspectSave(badVersion),/version/)
 assert.throws(()=>inspectSave(x.subarray(0,20)),/too short/)
})
