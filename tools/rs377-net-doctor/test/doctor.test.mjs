import {test} from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {isPrivateAddress,parseOptions,diagnose,HELLO_377} from '../doctor.mjs';

async function fixture(handler){
 return new Promise((resolve,reject)=>{
  const server=net.createServer(handler);
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve({
   port:server.address().port,
   close:()=>new Promise(done=>server.close(done))
  }));
 });
}
const opts=port=>({host:'127.0.0.1',port,timeoutMs:500,handshake:false,json:true});

test('only loopback, RFC1918, Tailscale, ULA and link-local are eligible',()=>{
 for(const ip of ['127.0.0.1','10.2.3.4','192.168.1.1','172.16.0.1',
   '172.31.255.1','100.64.0.1','100.127.255.255','::1','fd12::1',
   'fe80::1','::ffff:127.0.0.1'])
  assert.equal(isPrivateAddress(ip),true,ip);
 for(const ip of ['8.8.8.8','100.63.255.255','100.128.0.1','172.32.0.1',
   '1.1.1.1','2606:4700:4700::1111','::ffff:8.8.8.8'])
  assert.equal(isPrivateAddress(ip),false,ip);
});
test('invalid args and URLs fail closed',()=>{
 for(const args of [[],['--host','http://localhost'],['--host','foo:52402'],
  ['--host','localhost','--port','0'],['--host','localhost','--port','65536'],
  ['--host','localhost','--timeout-ms','50'],['--host','localhost','--bogus'],
  ['--host','localhost','--port']])assert.throws(()=>parseOptions(args));
 assert.equal(parseOptions(['--host','127.0.0.1','--handshake']).handshake,true);
});
test('default mode sends no login or handshake bytes',async()=>{
 let received=0;
 const s=await fixture(socket=>socket.on('data',chunk=>received+=chunk.length));
 try{
  const r=await diagnose(opts(s.port));
  assert.equal(r.checks.tcp.status,'CONNECTED');
  assert.equal(r.checks.handshake377.status,'SKIPPED');
  assert.equal(r.checks.actualPlayerLogin.status,'NOT_TESTED');
  assert.equal(r.checks.sameWorldAsElrothiro.status,'UNVERIFIED');
  assert.equal(received,0);
 }finally{await s.close();}
});
test('opt-in handshake sends EXACT [14,0] and accepts fragmented 17-byte reply only as unverified',async()=>{
 let received=Buffer.alloc(0);
 const s=await fixture(socket=>socket.on('data',chunk=>{
  received=Buffer.concat([received,chunk]);
  if(received.length===2){
   socket.write(Buffer.alloc(9));
   setTimeout(()=>socket.write(Buffer.alloc(8)),10);
  }
 }));
 try{
  const r=await diagnose({...opts(s.port),handshake:true});
  assert.deepEqual(received,HELLO_377);
  assert.equal(r.checks.handshake377.status,'RESPONSE_OBSERVED_UNVERIFIED');
  assert.equal(r.checks.handshake377.bytesReceived,17);
  assert.equal(r.checks.worldIdentity.status,'UNVERIFIED');
  assert.equal(r.checks.actualPlayerLogin.status,'NOT_TESTED');
 }finally{await s.close();}
});
test('partial hello response is INCOMPLETE, not accepted',async()=>{
 const s=await fixture(socket=>socket.on('data',()=>socket.end(Buffer.alloc(8))));
 try{
  const r=await diagnose({...opts(s.port),handshake:true});
  assert.equal(r.checks.handshake377.status,'INCOMPLETE');
  assert.equal(r.checks.worldIdentity.status,'UNVERIFIED');
 }finally{await s.close();}
});
test('public DNS is blocked without opening a socket',async()=>{
 const r=await diagnose({...opts(52402),host:'game.example'},
  async()=>[{address:'8.8.8.8',family:4}]);
 assert.equal(r.checks.privateRoute.status,'BLOCKED_PUBLIC_TARGET');
 assert.equal(r.checks.tcp.status,'NOT_RUN');
});
test('private DNS is pinned to resolved private IP instead of public alternative',async()=>{
 const s=await fixture(()=>{});
 try{
  const r=await diagnose({...opts(s.port),host:'game.example'},
   async()=>[{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}]);
  assert.equal(r.checks.privateRoute.address,'127.0.0.1');
  assert.equal(r.checks.tcp.status,'CONNECTED');
 }finally{await s.close();}
});
test('DNS failure and closed port never mean player login failure',async()=>{
 const a=await diagnose({...opts(52402),host:'bad.example'},
  async()=>{throw Object.assign(new Error('bad'),{code:'ENOTFOUND'})});
 assert.equal(a.checks.dns.status,'FAILED');
 assert.equal(a.checks.tcp.status,'NOT_RUN');
 const s=await fixture(()=>{});const port=s.port;await s.close();
 const b=await diagnose(opts(port));
 assert.equal(b.checks.tcp.status,'FAILED');
 assert.equal(b.checks.actualPlayerLogin.status,'NOT_TESTED');
});
