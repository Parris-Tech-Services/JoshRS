import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {generateKeyPairSync} from 'node:crypto';
import {Session377} from '../src/session.mjs';
import {buildAction} from '../src/protocol.mjs';
import {createSdk377Dispatcher} from '../src/sdk-dispatcher.mjs';
import {SKILLS377} from '../src/observation.mjs';

class SocketFixture extends EventEmitter {
  constructor(){super();this.writes=[];this.destroyed=false;queueMicrotask(()=>this.emit('connect'));}
  write(value) {
    this.writes.push(Buffer.from(value));
    if(this.writes.length===1)queueMicrotask(()=>this.emit('data',Buffer.alloc(17)));
    if(this.writes.length===2)queueMicrotask(()=>this.emit('data',Buffer.from([2,0,1])));
    return true;
  }
  end(){this.destroyed=true;this.emit('close');}
  destroy(){this.destroyed=true;this.emit('close');}
}
const key=generateKeyPairSync('rsa',{modulusLength:1024}).publicKey.export({type:'spki',format:'pem'});
const world={mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,
  instanceId:'isolated-dispatcher-test',sourceSha:'b5ac859b47915afb545e60e4c1208f25d43cb3fb'};
let tick=100;
const observation=()=>({
  world,player:{username:'HarnessBot',isBot:true},tick,
  position:{x:3233,z:3217,plane:0},
  skills:SKILLS377.map(name=>({name,level:1,baseLevel:1,xpTenths:0})),
  inventory:[],equipment:[],nearbyNpcs:[],nearbyLocs:[],groundItems:[],
  dialogue:{isOpen:false,options:[],isWaiting:false},questStages:{},sdkDetails:null
});
async function session(){
  const socket=new SocketFixture();
  const s=new Session377({
    target:{host:'127.0.0.1',port:53402},username:'HarnessBot',
    password:'fixture',publicKeyPem:key,crcs:Buffer.alloc(36,7),
    seedFactory:()=>[1,2,3,4],dial:()=>socket
  });
  await s.connect();
  return {s,socket};
}
test('mapped SDK walk reaches ISAAC-framed authenticated rev377 TCP write',async()=>{
  const {s,socket}=await session();
  const bridge=createSdk377Dispatcher({session:s,
    observer:{observe:async()=>observation()},botName:'HarnessBot',expectedWorld:world.instanceId});
  const result=await bridge.sendSdkAction({type:'walkTo',x:3234,z:3217,reason:'walk test'});
  assert.equal(result.phase,'dispatch');
  assert.equal(result.success,true);
  assert.equal(result.data.observed,false);
  assert.equal(socket.writes.length,3);
  const packet=socket.writes[2];
  assert.equal(packet[1],5);
  assert.deepEqual([...packet.subarray(2)],[34,12,0,17,12]);
  assert.equal(socket.writes[1].readUInt16BE(3),377);
  assert.equal((await bridge.sendSdkAction({type:'walkTo',x:3234,z:3217,reason:'repeat'})).reason,'rate_limit');
  tick++;
  assert.equal((await bridge.sendSdkAction({type:'walkTo',x:3234,z:3217,reason:'next tick'})).phase,'dispatch');
  assert.equal(socket.writes.length,4);
  bridge.stop();
  assert.equal((await bridge.sendSdkAction({type:'wait',reason:'later'})).reason,'stopped');
  s.close();
});
test('raw opcode-shaped object is forbidden and packet mutation invalidates capability',async()=>{
  const {s,socket}=await session();
  assert.throws(()=>s.sendPacket({opcode:56,body:Buffer.alloc(0),variable:false}),/Unverified/);
  const valid=buildAction({type:'walk',x:3233,z:3217});
  valid.body[0]=0;
  assert.throws(()=>s.sendPacket(valid),/modified/);
  assert.equal(socket.writes.length,2);
  s.close();
});
test('wrong account, wrong world, invalid observation and forbidden action never reach TCP',async()=>{
  const {s,socket}=await session();
  assert.throws(()=>createSdk377Dispatcher({session:s,observer:{observe:async()=>observation()},
    botName:'HarnessOther',expectedWorld:world.instanceId}),/identity/);
  const bridge=createSdk377Dispatcher({session:s,
    observer:{observe:async()=>({...observation(),world:{...world,instanceId:'isolated-other'}})},
    botName:'HarnessBot',expectedWorld:world.instanceId});
  const denied=await bridge.sendSdkAction({type:'walkTo',x:3234,z:3217,reason:'invalid'});
  assert.equal(denied.success,false);
  assert.equal(socket.writes.length,2);
  const safe=createSdk377Dispatcher({session:s,
    observer:{observe:async()=>observation()},botName:'HarnessBot',expectedWorld:world.instanceId});
  const d=await safe.sendSdkAction({type:'teleport',x:1,reason:'cheat'});
  assert.equal(d.success,false);
  assert.equal(socket.writes.length,2);
  s.close();
});
