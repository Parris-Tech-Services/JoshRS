import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {Session377,checkTarget} from '../src/session.mjs';
const pub=generateKeyPairSync('rsa',{modulusLength:1024}).publicKey.export({type:'spki',format:'pem'});
const config={target:{host:'127.0.0.1',port:53402},username:'HarnessBot',password:'secret-fixture',
  publicKeyPem:pub,crcs:Buffer.alloc(36,7),seedFactory:()=>[1,2,3,4]};
class SocketFixture extends EventEmitter {
  constructor(mode='success'){super();this.mode=mode;this.writes=[];this.destroyed=false;this.closed=false;
    queueMicrotask(()=>this.emit('connect'))}
  write(data) {
    this.writes.push(Buffer.from(data));
    if(this.mode==='success'){
      if(this.writes.length===1)queueMicrotask(()=>this.emit('data',Buffer.alloc(17)));
      else if(this.writes.length===2)queueMicrotask(()=>this.emit('data',Buffer.from([2,0,1])));
    } else if(this.mode==='wrong_crc' && this.writes.length===1){
      queueMicrotask(()=>this.emit('data',Buffer.alloc(17)));
    } else if(this.mode==='rejected'&&this.writes.length===1){
      queueMicrotask(()=>this.emit('data',Buffer.alloc(17)));
    } else if(this.mode==='rejected'&&this.writes.length===2) {
      queueMicrotask(()=>this.emit('data',Buffer.from([3])));
    }
    return true;
  }
  destroy(){this.destroyed=true;this.emit('close')}
  end(){this.closed=true;this.emit('close')}
}
test('explicit private targets only and never isolated production listener',()=>{
  assert.throws(()=>checkTarget({host:'8.8.8.8',port:53402}),/private/);
  assert.throws(()=>checkTarget({host:'google.com',port:53402}),/private/);
  assert.throws(()=>checkTarget({host:'127.0.0.1',port:52402}),/Production/);
  assert.throws(()=>checkTarget({host:'192.168.69.68',port:52402,mode:'family'}),/approval/);
  assert.equal(checkTarget({host:'192.168.69.68',port:52402,mode:'family',approvedFamily:true}).mode,'family');
});
test('normal login gets success only after 2 additional response bytes',async()=>{
  const socket=new SocketFixture();const s=new Session377({...config,dial:()=>socket});
  const result=await s.connect();
  assert.equal(result.authenticated,true);assert.equal(result.hasWorldState,false);
  assert.equal(s.status().authenticated,true);assert.equal(s.status().hasWorldState,false);
  assert.deepEqual([...socket.writes[0]],[14,0]);
  assert.equal(socket.writes[1].readUInt16BE(3),377);
  assert.equal(s.send({type:'walk',x:3222,z:3218}).status,'dispatched_unverified');
  assert.equal(s.send({type:'keepalive'}).status,'dispatched_unverified');
  assert.equal(s.close().status,'closed_unverified_save');
  assert.equal(socket.closed,true);
  assert.throws(()=>s.send({type:'walk',x:1,z:1}),/No authenticated/);
  await assert.rejects(()=>s.connect(),/already used/);
  assert.equal(JSON.stringify(s.status()).includes('secret-fixture'),false);
});
test('authentication failure redacts secrets and closes without reconnection',async()=>{
  const sock=new SocketFixture('rejected');
  const s=new Session377({...config,dial:()=>sock});
  await assert.rejects(()=>s.connect(),/rejected with code 3/);
  assert.equal(sock.destroyed,true);
  assert.equal(s.status().authenticated,false);
  assert.equal(JSON.stringify(s.status()).includes('secret-fixture'),false);
});
test('login times out safely when no handshake and only one dial',async()=>{
  let calls=0;const sock=new SocketFixture('silent');const s=new Session377({...config,timeoutMs:110,dial:()=>{calls++;return sock}});
  await assert.rejects(()=>s.connect(),/timeout/);
  assert.equal(calls,1);assert.equal(sock.destroyed,true);
});
test('bot login cannot reuse family account identity',()=>{
  assert.throws(()=>new Session377({...config,username:'Elrothiro'}),/disposable/);
  assert.throws(()=>new Session377({...config,username:'Sylvie'}),/disposable/);
});
