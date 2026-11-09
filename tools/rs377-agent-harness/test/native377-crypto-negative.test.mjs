import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {encode377Login} from '../src/native377/codec.mjs';

// Isolated server-side cryptographic fixture. Keys are ephemeral, never real game keys.
const server=generateKeyPairSync('rsa',{modulusLength:1024});
const other=generateKeyPairSync('rsa',{modulusLength:1024});
const pem=k=>k.export({type:'spki',format:'pem'});
const crc=Buffer.alloc(36,0x3c);
const login=publicKeyPem=>encode377Login({
 username:'FixtureBot',password:'fixture-only',publicKeyPem,crc,seedWords:[1,2,3,4]
}).packet;
function serverAccepts(packet){
 if(packet[0]!==16||packet[1]!==packet.length-2||packet.readUInt16BE(3)!==377)return false;
 if(!packet.subarray(6,42).equals(crc))return false;
 const size=packet[42],encrypted=packet.subarray(43);
 if(size!==encrypted.length)return false;
 const key=server.privateKey.export({format:'jwk'});
 const n=BigInt('0x'+Buffer.from(key.n,'base64url').toString('hex'));
 const d=BigInt('0x'+Buffer.from(key.d,'base64url').toString('hex'));
 let x=BigInt('0x'+encrypted.toString('hex')),r=1n;
 for(let e=d;e>0n;e>>=1n){if(e&1n)r=r*x%n;x=x*x%n;}
 let hex=r.toString(16);if(hex.length%2)hex='0'+hex;
 const plain=Buffer.from(hex,'hex');
 return plain[0]===10&&plain.subarray(21).toString('ascii')==='FixtureBot\x0afixture-only\x0a';
}
test('matching ephemeral server key and CRC authenticate fixture framing',()=>{
 assert.equal(serverAccepts(login(pem(server.publicKey))),true);
});
test('different well-formed RSA public key cannot authenticate to expected server',()=>{
 assert.equal(serverAccepts(login(pem(other.publicKey))),false);
});
test('correct-length but wrong CRC is rejected by server-side fixture',()=>{
 const packet=Buffer.from(login(pem(server.publicKey)));
 packet[6]^=0x01;
 assert.equal(serverAccepts(packet),false);
});
test('corrupted RSA ciphertext is rejected by server-side fixture',()=>{
 const packet=Buffer.from(login(pem(server.publicKey)));
 packet[packet.length-1]^=0x01;
 assert.equal(serverAccepts(packet),false);
});
