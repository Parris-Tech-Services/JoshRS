import test from 'node:test';
import assert from 'node:assert/strict';
import {crc32} from 'node:zlib';
import {verifySaveSnapshot} from './probe-fedora-harness377.mjs';

function u8(x){return Buffer.from([x&255])}
function u16(x){const b=Buffer.alloc(2);b.writeUInt16BE(x);return b}
function u32(x){const b=Buffer.alloc(4);b.writeUInt32BE(x>>>0);return b}
function sample(){
 const parts=[
  u16(0x2004),u16(7),u16(3222),u16(3218),u8(0),
  Buffer.alloc(7),Buffer.alloc(5),u8(0),u16(100),u32(20)
 ];
 for(let i=0;i<21;i++)parts.push(u32(i*1200),u8(i+1));
 parts.push(u16(0)); // 0 varps
 parts.push(u8(1)); // 1 saved inventory
 parts.push(u16(93),u16(3),u16(0),u16(2),u8(1),u16(3),u8(255),u32(300));
 parts.push(u8(0),u16(0),u8(0),Buffer.alloc(8));
 const body=Buffer.concat(parts);
 return Buffer.concat([body,u32(crc32(body))]);
}
test('authentic v7 CRC-checked save includes movement tile, 21 skills and real inventory slots',()=>{
 const result=verifySaveSnapshot(sample());
 assert.deepEqual(result.position,{x:3222,z:3218,plane:0});
 assert.equal(result.skills.length,21);
 assert.equal(result.skills[0].name,'Attack');
 assert.equal(result.skills[20].name,'Runecraft');
 assert.equal(result.skills[4].xpTenths,4800);
 assert.equal(result.inventories.length,1);
 assert.deepEqual(result.inventories[0],{typeId:93,capacity:3,
  items:[{slot:1,id:1,count:1},{slot:2,id:2,count:300}]});
 assert.match(result.saveSha256,/^[a-f0-9]{64}$/);
});
test('does not mistake corrupt player saves for legitimate movement evidence',()=>{
 const raw=sample(); raw[5]^=0x01;
 assert.throws(()=>verifySaveSnapshot(raw),/checksum|CRC mismatch/);
});
test('disallows unrecognised save versions, truncated saves and invalid coordinates',()=>{
 const tooNew=sample();tooNew.writeUInt16BE(20,2);
 assert.throws(()=>verifySaveSnapshot(tooNew),/version/);
 assert.throws(()=>verifySaveSnapshot(Buffer.alloc(5)),/short/);
 const badTile=sample();badTile.writeUInt16BE(65535,4);
 badTile.writeUInt32BE(crc32(badTile.subarray(0,badTile.length-4)),badTile.length-4);
 assert.throws(()=>verifySaveSnapshot(badTile),/coordinates/);
});
