import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {buildAction,buildLogin,Isaac377,framePacket,p2,p2alt1,p2alt2,p2alt3} from '../src/protocol.mjs';

const g2=(b,k)=>k==='normal'?b.readUInt16BE(0):
  k==='a1'?(b[1]<<8|b[0]):
  k==='a2'?(b[0]<<8|((b[1]-128)&255)):
  (b[1]<<8|((b[0]-128)&255));
test('377 alternate-two-byte transforms inverse of pinned Packet.ts g2_alt1/2/3',()=>{
  for(let n of [0,1,127,128,255,256,3217,3233,16383,65535]){
    assert.equal(g2(p2(n),'normal'),n);assert.equal(g2(p2alt1(n),'a1'),n);
    assert.equal(g2(p2alt2(n),'a2'),n);assert.equal(g2(p2alt3(n),'a3'),n);
  }
});
test('legacy JoshRS MOVE_GAMECLICK body remains byte-identical, variable-length framed',()=>{
  const p=buildAction({type:'walk',x:3233,z:3217,running:false});
  assert.equal(p.opcode,28);assert.equal(p.variable,true);
  assert.deepEqual([...p.body],[33,12,0,17,12]);
  const i=new Isaac377([1,2,3,4]);const x=framePacket(p,i);
  assert.equal(x.length,7);assert.equal(x[1],5);
});
test('opnpc 1-5 slot uses actual pinned per-option alt order',()=>{
  const codes=[112,67,13,42,8],alts=['a1','a2','a3','a1','a1'];
  for(let op=1;op<=5;op++){
    const p=buildAction({type:'npc',npcSlot:1419,option:op});
    assert.equal(p.opcode,codes[op-1]);assert.equal(g2(p.body,alts[op-1]),1419);
  }
});
test('oploc 1-5 respects byte-specific ordered fields from OpLocDecoder',()=>{
  const v=[[['x','a2'],['z','a1'],['id','a1']],
    [['id','normal'],['x','normal'],['z','a2']],
    [['z','a2'],['id','a1'],['x','a3']],
    [['x','normal'],['z','a1'],['id','normal']],
    [['id','a1'],['z','a1'],['x','normal']]];
  const data={x:3201,z:3218,id:1534};
  for(let op=1;op<=5;op++){
    const p=buildAction({type:'loc',x:data.x,z:data.z,locId:data.id,option:op});
    assert.equal(p.opcode,[181,241,50,136,55][op-1]);assert.equal(p.body.length,6);
    v[op-1].forEach(([k,alt],i)=>assert.equal(g2(p.body.subarray(i*2,i*2+2),alt),data[k]));
  }
});
test('ground item, held inventory and interface inventory packet layout',()=>{
  const ground=buildAction({type:'ground',x:3200,z:3202,itemId:1925,option:1});
  assert.equal(ground.opcode,77);
  assert.equal(g2(ground.body.subarray(0,2),'a2'),3200);
  assert.equal(g2(ground.body.subarray(2,4),'normal'),3202);
  assert.equal(g2(ground.body.subarray(4,6),'a3'),1925);
  const held=buildAction({type:'held',componentId:3214,slot:3,itemId:1925,option:1});
  assert.equal(held.opcode,203);assert.equal(g2(held.body.subarray(0,2),'a2'),3214);
  assert.equal(g2(held.body.subarray(2,4),'a1'),3);
  const other=buildAction({type:'inventory',componentId:3322,slot:3,itemId:1925,option:1});
  assert.equal(other.opcode,3);assert.equal(g2(other.body.subarray(0,2),'a2'),1925);
  assert.equal(g2(other.body.subarray(2,4),'normal'),3322);
});
test('OPLOCU selects component, actual item from observed inventory and exact 12-byte ordering',()=>{
  const p=buildAction({type:'item_on_loc',x:3214,z:3215,locId:141,componentId:3214,itemId:1925,slot:7});
  assert.equal(p.opcode,152);assert.equal(p.body.length,12);
  assert.deepEqual([g2(p.body.subarray(0,2),'a1'),g2(p.body.subarray(2,4),'a1'),
    g2(p.body.subarray(4,6),'a1'),g2(p.body.subarray(6,8),'a1'),
    g2(p.body.subarray(8,10),'normal'),g2(p.body.subarray(10,12),'a3')],[141,3214,1925,3215,7,3214]);
});
test('dialog resume is actual 2-byte packet; chat requires pre-encoded WordPack',()=>{
  assert.equal(buildAction({type:'dialog_resume',componentId:123}).opcode,226);
  assert.throws(()=>buildAction({type:'chat',wordpack:'hello'}),/WordPack/);
  const p=buildAction({type:'chat',wordpack:Buffer.from([0xaa,0xbb]),color:0,effect:0});
  assert.equal(p.opcode,49);assert.deepEqual([...p.body],[0,0,170,187]);
});
test('no privileged opcode, malformed coordinates, invalid options, or guessed logout',()=>{
  for(const a of [{type:'teleport',x:1},{type:'admin'},{type:'addXp',xp:99},
      {type:'walk',x:65535,z:1},{type:'walk',x:1,z:2,systemCommand:'x'},
      {type:'npc',option:0,npcSlot:1},{type:'logout'}]){
    assert.throws(()=>buildAction(a));
  }
});
test('RSA/public key login is revision 377, 9 CRC words, ISAAC deterministic, never embeds plaintext password',()=>{
  const key=generateKeyPairSync('rsa',{modulusLength:1024}).publicKey.export({type:'spki',format:'pem'});
  const made=buildLogin({username:'HarnessBot',password:'fixturePwd',publicKeyPem:key,
    crcs:Buffer.alloc(36,5),seed:[1,2,3,4]});
  assert.equal(made.packet[0],16);assert.equal(made.packet[1],made.packet.length-2);
  assert.equal(made.packet.readUInt16BE(3),377);
  assert.deepEqual([...made.packet.subarray(6,42)],Array(36).fill(5));
  assert.equal(made.packet.includes(Buffer.from('fixturePwd')),false);
  const independent=new Isaac377([1,2,3,4]);
  assert.deepEqual(Array.from({length:10},()=>made.outboundIsaac.nextInt()),
    Array.from({length:10},()=>independent.nextInt())); // validates repeatability
});
test('login rejects missing CRC, private/short data and malformed credentials',()=>{
  const key=generateKeyPairSync('rsa',{modulusLength:1024}).publicKey.export({type:'spki',format:'pem'});
  const data={username:'HarnessBot',password:'fixture',publicKeyPem:key,crcs:Buffer.alloc(36),seed:[1,2,3,4]};
  assert.throws(()=>buildLogin({...data,crcs:Buffer.alloc(4)}),/Nine/);
  assert.throws(()=>buildLogin({...data,username:'real.player.with.long.username'}));
  assert.throws(()=>buildLogin({...data,password:''}));
  assert.throws(()=>buildLogin({...data,publicKeyPem:'not a key'}));
});
