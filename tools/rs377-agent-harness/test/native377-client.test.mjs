import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {generateKeyPairSync} from 'node:crypto';
import {Client377} from '../src/native377/client.mjs';

async function fixtureServer(reply=2){
  const received={};
  const server=net.createServer(socket=>{
    let stage=0,buf=Buffer.alloc(0);
    socket.on('data',chunk=>{
      buf=Buffer.concat([buf,chunk]);
      while(true){
        if(stage===0){
          if(buf.length<2)return;
          received.hello=buf.subarray(0,2);buf=buf.subarray(2);stage=1;
          socket.write(Buffer.alloc(5));
          setImmediate(()=>socket.write(Buffer.alloc(12)));
        }
        if(stage===1){
          if(buf.length<2)return;
          if(buf.length<buf[1]+2)return;
          received.login=Buffer.from(buf.subarray(0,buf[1]+2));
          buf=buf.subarray(buf[1]+2);stage=2;
          socket.write(Buffer.from([reply]));
        }
        if(stage===2){
          if(buf.length>=7){received.movement=Buffer.from(buf.subarray(0,7));stage=3;}
          return;
        }
        return;
      }
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {port:server.address().port,received,close:()=>new Promise(resolve=>server.close(resolve))};
}
test('native 377 client authenticates via fragmented handshake and sends a normal move packet',async()=>{
  const mock=await fixtureServer();
  const {publicKey}=generateKeyPairSync('rsa',{modulusLength:1024});
  const c=new Client377({port:mock.port,username:'HarnessTest',password:'fixture',publicKeyPem:publicKey.export({type:'spki',format:'pem'}),crc:Buffer.alloc(36,4),keepaliveMs:30000});
  try{
    assert.equal((await c.connect()).response,2);
    assert.deepEqual([...mock.received.hello],[14,0]);
    assert.equal(mock.received.login.readUInt16BE(3),377);
    assert.equal(c.walkTo(3233,3217).status,'dispatched_unverified');
    for(let i=0;i<40&&!mock.received.movement;i++)await new Promise(r=>setTimeout(r,5));
    assert.ok(mock.received.movement);
    assert.deepEqual([...mock.received.movement.subarray(2)],[33,12,0,17,12]);
    assert.equal(c.status().hasWorldState,false);
  }finally{c.close();await mock.close();}
});
test('rejected login does not permit movement or automatic reconnect',async()=>{
  const mock=await fixtureServer(3);
  const {publicKey}=generateKeyPairSync('rsa',{modulusLength:1024});
  const c=new Client377({port:mock.port,username:'HarnessTest',password:'fixture',publicKeyPem:publicKey.export({type:'spki',format:'pem'}),crc:Buffer.alloc(36,4)});
  try{
    await assert.rejects(c.connect(),/response 3/);
    assert.throws(()=>c.walkTo(3222,3218),/not authenticated/);
    await assert.rejects(c.connect(),/Closed client/);
  }finally{c.close();await mock.close();}
});
