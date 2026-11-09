import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicKey} from 'node:crypto';
import {options,clientPublic377,fetchCrc37,verificationDestination,patrolWaypoint} from './join.mjs';
import {buildAction,framePacket,Isaac377} from '../rs377-chatgpt-bridge/src/protocol.mjs';
import {nameToBase37} from '../rs377-chatgpt-bridge/src/wordpack377.mjs';

function args(...xs){return options(['--connect','--allow-family','--host','127.0.0.1',...xs])}
test('safe import does not start any socket; default and incomplete approvals refused',()=>{
 assert.throws(()=>options([]),/Explicit/);
 assert.throws(()=>options(['--connect','--host','127.0.0.1']),/Explicit/);
 assert.throws(()=>options(['--allow-family','--host','127.0.0.1']),/Explicit/);
});
test('private loopback, LAN and Tailscale targets require explicit family approval',()=>{
 for(const ip of ['127.0.0.1','192.168.69.68','10.3.5.1','100.100.100.101']){
  let x=options(['--connect','--allow-family','--host',ip]);
  assert.equal(x.host,ip);assert.equal(x.port,52402);
 }
 for(const ip of ['8.8.8.8','1.1.1.1','203.0.113.42','github.com','169.254.10.1']){
  assert.throws(()=>options(['--connect','--allow-family','--host',ip]),/private|numeric|Only/);
 }
});
test('safe bot identity and durations and ports cannot silently target family user',()=>{
 assert.equal(args('--bot','HarnessA','--seconds','15').bot,'HarnessA');
 assert.throws(()=>args('--bot','Elrothiro'),/separate bot/);
 assert.throws(()=>args('--bot','Sylvie'),/separate bot/);
 assert.throws(()=>args('--bot','HarnessVeryLongName'),/separate bot/);
 assert.throws(()=>args('--seconds','3600'),/Duration/);
 assert.throws(()=>args('--seconds','0'),/Duration/);
 assert.throws(()=>args('--port','80'),/port/i);
 assert.throws(()=>args('--web-port','52402'),/web port/);
 assert.throws(()=>args('--unknown'),/Unknown/);
});
test('read-only position evidence is explicit and requires the patrol',()=>{
 const o=args('--bot','HarnessView1','--patrol','--verify-position');
 assert.equal(o.verifyPosition,true);
 assert.throws(()=>args('--verify-position'),/requires --patrol/);
 assert.equal(args('--bot','HarnessView1','--patrol').verifyPosition,false);
});
test('public key matches exact pinned revision-377 Client-Java constants',()=>{
 const jwk=createPublicKey(clientPublic377()).export({format:'jwk'});
 const dec=x=>BigInt('0x'+Buffer.from(x,'base64url').toString('hex')).toString();
 assert.equal(dec(jwk.n),'7162900525229798032761816791230527296329313291232324290237849263501208207972894053929065636522363163621000728841182238772712427862772219676577293600221789');
 assert.equal(dec(jwk.e),'58778699976184461502525193738213253649000149147835990136706041084440742975821');
});
test('only a bounded exact 40-byte cache CRC is accepted from the correct private host',async()=>{
 let called='';
 const fetchImpl=async(url,opts)=>{
  called=url;assert.equal(opts.redirect,'error');
  return {ok:true,headers:new Headers({'content-length':'40'}),
    arrayBuffer:async()=>Uint8Array.from({length:40},(_,i)=>i).buffer};
 };
 const r=await fetchCrc37('127.0.0.1',8888,{fetchImpl});
 assert.equal(r.length,36);assert.equal(r[0],0);assert.equal(r[35],35);
 assert.equal(called,'http://127.0.0.1:8888/crc0');
 await assert.rejects(()=>fetchCrc37('8.8.8.8',8888,{fetchImpl}),/Only/);
 await assert.rejects(()=>fetchCrc37('127.0.0.1',80,{fetchImpl}),/Invalid/);
 await assert.rejects(()=>fetchCrc37('127.0.0.1',8888,
  {fetchImpl:async()=>({ok:true,headers:new Headers(),arrayBuffer:async()=>new ArrayBuffer(41)})}),/40-byte/);
});

test('only named Elrothiro can be added; no silent or arbitrary friendship writes',()=>{
 assert.equal(args('--add-friend','Elrothiro').addFriend,'Elrothiro');
 assert.equal(args().addFriend,null);
 for(const target of ['Sylvie','harnessscout','elrothiro','Elrothiro2','', '--patrol']){
  assert.throws(()=>args('--add-friend',target));
 }
});
test('native revision 377 friend add is opcode 120, fixed 8-byte canonical base37',()=>{
 const pkt=buildAction({type:'friend_add',targetName:'Elrothiro'});
 assert.equal(pkt.opcode,120);
 assert.equal(pkt.variable,false);
 assert.equal(pkt.body.length,8);
 assert.equal(pkt.body.readBigUInt64BE(),nameToBase37('Elrothiro'));
 assert.deepEqual(pkt,buildAction({type:'friend_add',targetName:'ELROTHIRO'}));
 // Normal outbound ISAAC must encrypt the opcode; no extra length byte.
 const seed=[0,0,0,0],frame=framePacket(pkt,new Isaac377(seed));
 assert.equal(frame.length,9);
 assert.deepEqual(frame.subarray(1),pkt.body);
 assert.throws(()=>buildAction({type:'friend_add',targetName:'Elrothiro',admin:true}),/Unexpected/);
 assert.throws(()=>buildAction({type:'friend_add',targetName:'é'}),/Invalid/);
});

test('verified patrol pins last 30s to a distinct Lumbridge tile instead of round-trip start',()=>{
 const startingPosition={x:3233,z:3217};
 assert.deepEqual(verificationDestination(startingPosition),[3232,3220]);
 assert.deepEqual(patrolWaypoint(20,{verifyPosition:false,startingPosition,
   elapsedMs:115500,durationMs:120000}),[3233,3217]);
 for(const step of [16,17,18,19,20,21]){
  assert.deepEqual(patrolWaypoint(step,{verifyPosition:true,startingPosition,
    elapsedMs:90000+step*1000,durationMs:120000}),[3232,3220]);
 }
 assert.deepEqual(patrolWaypoint(10,{verifyPosition:true,startingPosition,
   elapsedMs:89999,durationMs:120000}),[3232,3220]);
 assert.deepEqual(patrolWaypoint(8,{verifyPosition:true,startingPosition,
   elapsedMs:10000,durationMs:120000}),[3233,3217]);
});
test('distinct final target is selected for any of the four starting waypoints',()=>{
 for(const [x,z] of [[3233,3217],[3231,3218],[3232,3220],[3234,3219]]){
  const [tx,tz]=verificationDestination({x,z});
  assert.notDeepEqual([tx,tz],[x,z]);
  assert.ok(tx>=3231&&tx<=3234);
  assert.ok(tz>=3217&&tz<=3220);
 }
 assert.throws(()=>verificationDestination({x:NaN,z:3217}),/valid saved/);
 assert.throws(()=>patrolWaypoint(-1),/Invalid patrol/);
});
