import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {createNativeClient377Control} from '../src/java-client-control.mjs';
import {mapExtendedSdkAction} from '../src/sdk-action-extensions.mjs';

const TOKEN='a'.repeat(40);
const BOT='HarnessProbe',WORLD='isolated-joshrs-ci-377';
async function withFakeClient(fn,{designOpen=true,wrongToken=false}={}){
 const state={tab:3,cycle:100,designOpen,gender:0,hash:111,accepted:false};
 const commands=[];
 const server=createServer(socket=>{
  let body='';
  socket.setEncoding('ascii');
  socket.on('data',chunk=>{
   body+=chunk;
   if(!body.includes('\n'))return;
   const [token,action,arg]=body.split('\n')[0].split('\t');
   commands.push(action);
   let response='ERR|invalid_request';
   if(token===TOKEN&&!wrongToken){
    state.cycle++;
    if(action==='status')
     response=['OK','status',state.tab,state.designOpen?1:0,state.gender,state.hash,state.cycle].join('|');
    else if(action==='setTab'&&Number(arg)>=0&&Number(arg)<=13){
     state.tab=Number(arg);response=['OK','tab',state.tab,state.cycle].join('|');
    }else if(action==='randomizeCharacterDesign'&&state.designOpen){
     state.hash++;response=['OK','randomized',state.cycle,'OK','status',state.tab,1,state.gender,state.hash,state.cycle].join('|');
    }else if(action==='acceptCharacterDesign'&&state.designOpen){
     state.accepted=true;response=['OK','design_packet_queued_unverified',state.cycle].join('|');
    }else if(action==='nativePacket'){
     const raw=Buffer.from(body.split('\n')[0].split('\t')[3]||'','base64');
     if(Number(arg)===112&&raw.length===2)
      response=['OK','native_packet_queued_unverified',arg,state.cycle].join('|');
     else response='ERR|normal_377_packet_not_allowlisted';
    }else response='ERR|player_kit_interface_not_open';
   }
   socket.write(response+'\n',()=>socket.end());
  });
 });
 await new Promise(res=>server.listen(0,'127.0.0.1',res));
 const port=server.address().port;
 try{return await fn(createNativeClient377Control({port,token:TOKEN,botName:BOT,worldId:WORLD}),state,commands)}
 finally{await new Promise(res=>server.close(res))}
}
test('all three client actions map to explicit opt-in client boundary not dangerous TCP packets',()=>{
 for(const [type,args] of [
  ['setTab',{tabIndex:2}],['randomizeCharacterDesign',{}],
  ['acceptCharacterDesign',{}]
 ]){
  const mapped=mapExtendedSdkAction({type,...args,reason:'native isolated client'},null);
  assert.equal(mapped.kind,'client',type);
  assert.equal(mapped.verifiedEffect,false);
  assert.equal(mapped.action.type,type);
  assert.equal('packet' in mapped,false);
 }
 assert.throws(()=>mapExtendedSdkAction({type:'setTab',tabIndex:14,reason:'x'},null),/refused/);
});
test('native Java tab change confirmed by a second observed client update tick',async()=>{
 await withFakeClient(async c=>{
  const result=await c.perform({type:'setTab',tabIndex:5});
  assert.equal(result.status,'client_effect_observed');
  assert.equal(result.verifiedEffect,true);
  assert.equal(result.tabIndex,5);
  assert.equal((await c.status()).tab,5);
 });
});
test('randomize requires actual player_kit modal and changed appearance state',async()=>{
 await withFakeClient(async c=>{
  const result=await c.perform({type:'randomizeCharacterDesign'});
  assert.equal(result.status,'client_effect_observed');
  assert.equal(result.effect,'randomize');
 },{designOpen:true});
 await withFakeClient(async c=>{
  await assert.rejects(()=>c.perform({type:'randomizeCharacterDesign'}),/player_kit_interface_not_open/);
 },{designOpen:false});
});
test('design acceptance never reports server completion from a local packet write',async()=>{
 await withFakeClient(async (c,s)=>{
  const result=await c.perform({type:'acceptCharacterDesign'});
  assert.equal(s.accepted,true);
  assert.equal(result.status,'client_packet_dispatched_unverified');
  assert.equal(result.verifiedEffect,false);
 });
});
test('missing token, family port, invalid world or user reject local client control',()=>{
 const opts={port:19083,token:TOKEN,botName:BOT,worldId:WORLD};
 for(const bad of [
  {...opts,port:52402},{...opts,botName:'Elrothiro'},
  {...opts,worldId:'main'}, {...opts,token:'short'},
  {...opts,port:18880},{...opts,botName:'HarnessBot\n'}
 ])assert.throws(()=>createNativeClient377Control(bad),/required/);
});
test('no code path reports a disconnected Java client as successful',async()=>{
 await withFakeClient(async c=>{
  await assert.rejects(()=>c.perform({type:'setTab',tabIndex:3}),/invalid_request/);
 },{wrongToken:true});
});

test('one actual Java client session carries normal mapped ISAAC packets, without second TCP login',async()=>{
 const {createJavaClient377Session}=await import('../src/java-client-session.mjs');
 const {buildAction}=await import('../src/protocol.mjs');
 await withFakeClient(async(c,state,commands)=>{
  const session=await createJavaClient377Session(c);
  assert.equal(session.status().authenticated,true);
  await session.refresh();
  const native=buildAction({type:'npc',npcSlot:12,option:1});
  const sent=await session.sendPacket(native);
  assert.equal(sent.status,'queued_unverified');
  assert.equal(sent.opcode,112);
  assert.equal(sent.verifiedEffect,false);
  assert.ok(commands.includes('nativePacket'));
  await assert.rejects(()=>session.sendPacket({
   opcode:250,body:Buffer.from([1])
  }),/normal_377_packet_not_allowlisted/);
  await session.disconnect();
  assert.equal(session.status().authenticated,false);
 });
});
