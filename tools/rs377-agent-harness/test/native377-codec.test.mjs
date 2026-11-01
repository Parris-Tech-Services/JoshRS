import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {Isaac377, encode377Login, encode377Move, encode377ClientPacket, makeSeedWords} from '../src/native377/codec.mjs';
import {validate377Target} from '../src/native377/client.mjs';
test('revision-377 public-key login creates correct revision and checksum framing',()=>{
  const {publicKey}=generateKeyPairSync('rsa',{modulusLength:1024});
  const publicKeyPem=publicKey.export({type:'spki',format:'pem'});
  const crc=Buffer.alloc(36,5);
  const encoded=encode377Login({username:'HarnessTest',password:'fixture',publicKeyPem,crc,seedWords:[1,2,3,4]});
  assert.deepEqual(encoded.seed,[1,2,3,4]);
  assert.equal(encoded.packet[0],16);
  assert.equal(encoded.packet[1],encoded.packet.length-2);
  assert.equal(encoded.packet.readUInt16BE(3),377);
  assert.deepEqual(encoded.packet.subarray(6,42),crc);
});
test('native move packet and ISAAC produce deterministic allowlisted packets',()=>{
  assert.equal(makeSeedWords().length,4);
  assert.deepEqual([...encode377Move(3233,3217)],[33,12,0,17,12]);
  const x=new Isaac377([1,2,3,4]),y=new Isaac377([1,2,3,4]);
  assert.deepEqual(Array.from({length:6},()=>x.nextInt()),Array.from({length:6},()=>y.nextInt()));
  const z=new Isaac377([1,2,3,4]);
  const packet=encode377ClientPacket(z,28,encode377Move(3233,3217),true);
  assert.equal(packet.length,7);
  assert.deepEqual([...packet.subarray(2)],[33,12,0,17,12]);
  assert.throws(()=>encode377ClientPacket(z,63),/Only allowed/);
});
test('isolated mode rejects a production port and live mode needs approval',()=>{
  assert.throws(()=>validate377Target({port:52402}),/Production/);
  assert.throws(()=>validate377Target({world:'family',port:52402}),/approval/);
  assert.throws(()=>validate377Target({host:'8.8.8.8'}),/private/);
  assert.equal(validate377Target({host:'192.168.1.5',world:'family',port:52402,approvedLive:true}).world,'family');
});
