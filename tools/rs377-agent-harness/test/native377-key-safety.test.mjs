import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {encode377Login} from '../src/native377/codec.mjs';
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:1024});
const pem=publicKey.export({type:'spki',format:'pem'});
const valid={username:'TestBot',password:'offline',publicKeyPem:pem,crc:Buffer.alloc(36),seedWords:[1,2,3,4]};
test('private RSA key is never accepted by the client login encoder',()=>{
 assert.throws(()=>encode377Login({...valid,publicKeyPem:privateKey.export({type:'pkcs8',format:'pem'})}),/public RSA|private key/i);
});
test('malformed or missing public key is rejected',()=>{
 assert.throws(()=>encode377Login({...valid,publicKeyPem:'invalid'}),/public RSA/i);
});
test('missing, truncated and oversized CRC payloads are rejected',()=>{
 for(const crc of [undefined,Buffer.alloc(35),Buffer.alloc(37)])assert.throws(()=>encode377Login({...valid,crc}),/36 cache CRC bytes/);
});
test('valid public-key login preserves exact 377 and CRC framing',()=>{
 const crc=Buffer.alloc(36,0x5a);
 const {packet}=encode377Login({...valid,crc});
 assert.equal(packet.readUInt16BE(3),377);
 assert.deepEqual(packet.subarray(6,42),crc);
});
