import test from 'node:test';
import assert from 'node:assert/strict';
import {mapSdkAction} from '../src/sdk-bridge.mjs';
import {SDK377_ACTION_TYPES,SDK377_ACTION_COVERAGE} from '../src/sdk-action-coverage.mjs';
import {buildAction,p2alt1,p2alt2,p2alt3} from '../src/protocol.mjs';
import {packWord377,nameToBase37} from '../src/wordpack377.mjs';
import {SKILLS377,validateObservation} from '../src/observation.mjs';

const REASON='Pinned native 377 action test';
function state(){
 const raw={
  world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,
   instanceId:'isolated-sdk39-test',sourceSha:'b5ac859b47915afb545e60e4c1208f25d43cb3fb'},
  player:{username:'HarnessProof',isBot:true},tick:100,
  position:{x:3222,z:3218,plane:0},
  skills:SKILLS377.map(name=>({name,level:60,baseLevel:60,xpTenths:500000})),
  inventory:[{slot:0,id:1925,count:3,name:'Bucket'},
             {slot:1,id:316,count:5,name:'Raw shrimp'},
             {slot:2,id:995,count:250,name:'Coins'}],
  equipment:[{slot:3,id:1277,count:1,name:'Bronze sword'}],
  nearbyNpcs:[{index:12,id:7,x:3223,z:3218,name:'Cook'}],
  nearbyLocs:[{id:10,x:3221,z:3217,level:0,name:'Door'}],
  groundItems:[{id:1925,x:3220,z:3218,level:0,count:1,name:'Bucket'}],
  dialogue:{isOpen:false,options:[],isWaiting:false},questStages:{barcrawl:0},
  sdkDetails:{
   nearbyPlayers:[{index:19,name:'HarnessOther',x:3222,z:3219}],
   interface:{isOpen:true,interfaceId:5609,options:[
    {index:1,text:'Prayer',componentId:5609}]},
   modalOpen:true,modalInterface:5382,
   shop:{isOpen:true,shopItems:[{slot:10,id:310,count:10,name:'Lobster'}],
     playerItems:[{slot:0,id:1925,count:3,name:'Bucket'}]},
   bank:{isOpen:true,items:[{slot:51,id:995,count:250,name:'Coins'}]},
   prayers:{activePrayers:Array(15).fill(false),prayerPoints:60,prayerLevel:60},
   combatStyle:{known:true,styles:[{index:1,componentId:1700}]},
   visibleSpellComponents:[112,113],
   equipmentComponentId:1688,
   countDialog:{isOpen:true,kind:'number',tick:100}
  }
 };
 return validateObservation(raw,{botName:'HarnessProof',expectedWorld:'isolated-sdk39-test'});
}
const action=(type,props={})=>({type,...props,reason:REASON});
const native=[
 ['interactPlayer',{playerIndex:19,optionIndex:2},233],
 ['clickComponent',{componentId:5609},79],
 ['clickComponentWithOption',{componentId:3214,slot:0,optionIndex:1},203],
 ['useEquipmentItem',{slot:3,optionIndex:1},3],
 ['dropItem',{slot:0},4],
 ['shopBuy',{slot:10,amount:5},91],
 ['shopSell',{slot:0,amount:1},177],
 ['closeShop',{},110],
 ['closeModal',{},110],
 ['setCombatStyle',{style:1},79],
 ['useItemOnItem',{sourceSlot:0,targetSlot:1},1],
 ['useItemOnNpc',{itemSlot:0,npcIndex:12},57],
 ['say',{message:'Hello world!'},49],
 ['privateMessage',{targetName:'HarnessOther',message:'Hello'},227],
 ['spellOnNpc',{npcIndex:12,spellComponent:112},104],
 ['spellOnPlayer',{playerIndex:19,spellComponent:112},31],
 ['spellOnItem',{slot:0,spellComponent:112},36],
 ['spellOnGroundItem',{x:3220,z:3218,itemId:1925,spellComponent:112},83],
 ['bankDeposit',{slot:0,amount:5},177],
 ['bankWithdraw',{slot:51,amount:10},91],
 ['submitCountDialog',{value:42},75],
 ['togglePrayer',{prayerIndex:2},79]
];
test('all 39 original BotAction types are explicitly classified once',()=>{
 assert.equal(SDK377_ACTION_TYPES.length,39);
 assert.equal(new Set(SDK377_ACTION_TYPES).size,39);
 for(const type of SDK377_ACTION_TYPES)assert.ok(SDK377_ACTION_COVERAGE[type]);
 assert.equal(SDK377_ACTION_COVERAGE.searchGE.mode,'absent');
 assert.equal(SDK377_ACTION_COVERAGE.setTab.mode,'client');
 assert.equal(SDK377_ACTION_COVERAGE.scanNearbyLocs.mode,'read');
});
test('22 newly covered native packet variants encode genuine 377 opcodes',()=>{
 const s=state();
 for(const [type,args,opcode] of native){
  const result=mapSdkAction(action(type,args),s);
  assert.equal(result.kind,'packet',type);
  assert.equal(result.packet.opcode,opcode,type);
  assert.equal(result.result,'dispatched_unverified',type);
  assert.ok(Buffer.isBuffer(result.packet.body),type);
 }
});
test('all 28 previously-unmapped upstream actions have an explicit mapping or precise refusal',()=>{
 const covered=[...native.map(x=>x[0]),'scanNearbyLocs','scanGroundItems',
  'acceptCharacterDesign','randomizeCharacterDesign','setTab','searchGE'];
 assert.equal(covered.length,28);
 assert.equal(new Set(covered).size,28);
 for(const type of covered)assert.ok(SDK377_ACTION_COVERAGE[type],type);
 const s=state();
 for(const type of ['acceptCharacterDesign','randomizeCharacterDesign','setTab']){
  const args=type==='setTab'?{tabIndex:2}:{};
  const mapped=mapSdkAction(action(type,args),s);
  assert.equal(mapped.kind,'client',type);
  assert.equal(mapped.verifiedEffect,false);
 }
 assert.throws(()=>mapSdkAction(action('searchGE',{query:'bronze'}),s),/SDK action refused/);
});
test('native scans reveal existing visible objects, not a game mutation',()=>{
 const s=state();
 const loc=mapSdkAction(action('scanNearbyLocs',{radius:8}),s);
 const ground=mapSdkAction(action('scanGroundItems',{radius:8}),s);
 assert.equal(loc.kind,'read');assert.equal(loc.readType,'nearbyLocs');
 assert.equal(loc.data.length,1);assert.equal(loc.data[0].id,10);
 assert.equal(ground.kind,'read');assert.equal(ground.data.length,1);
 assert.equal(ground.data[0].id,1925);
 assert.equal(loc.verifiedEffect,false);
 assert.throws(()=>mapSdkAction(action('scanGroundItems',{radius:100}),s),/refused/);
});
test('all bank/shop quantities have precise original native button mappings',()=>{
 const s=state();
 const buys=[[1,177],[5,91],[10,231]];
 for(const [amount,opcode] of buys)
  assert.equal(mapSdkAction(action('shopBuy',{slot:10,amount}),s).packet.opcode,opcode);
 const banks=[[1,3],[5,177],[10,91],[250,231]];
 for(const [amount,opcode] of banks)
  assert.equal(mapSdkAction(action('bankWithdraw',{slot:51,amount}),s).packet.opcode,opcode);
 for(const amount of [0,-1,2,17,100000])
  assert.throws(()=>mapSdkAction(action('bankDeposit',{slot:0,amount}),s),/refused/);
});
test('all dangerous blind actions refuse without native visibility or current UI context',()=>{
 const s=state();
 function stripped(){
  const raw=structuredClone(s);delete raw.unsupported;
  raw.sdkDetails={
   nearbyPlayers:[],interface:{isOpen:false,options:[]},modalOpen:false,
   shop:{isOpen:false},bank:{isOpen:false},
   prayers:{activePrayers:null,prayerPoints:0,prayerLevel:1}
  };
  raw.nearbyNpcs=[];raw.nearbyLocs=[];raw.groundItems=[];
  return validateObservation(raw,{botName:'HarnessProof',expectedWorld:'isolated-sdk39-test'});
 }
 const bad=stripped();
 const cases=[
  action('interactPlayer',{playerIndex:19,optionIndex:1}),
  action('clickComponent',{componentId:5609}),
  action('clickComponentWithOption',{componentId:3900,slot:10,optionIndex:2}),
  action('useEquipmentItem',{slot:3,optionIndex:1}),
  action('shopBuy',{slot:10,amount:1}),
  action('shopSell',{slot:0,amount:1}),
  action('closeModal'),action('closeShop'),
  action('setCombatStyle',{style:1}),
  action('useItemOnNpc',{itemSlot:0,npcIndex:12}),
  action('spellOnNpc',{npcIndex:12,spellComponent:112}),
  action('spellOnPlayer',{playerIndex:19,spellComponent:112}),
  action('spellOnItem',{slot:0,spellComponent:112}),
  action('spellOnGroundItem',{x:3220,z:3218,itemId:1925,spellComponent:112}),
  action('bankDeposit',{slot:0,amount:1}),
  action('bankWithdraw',{slot:51,amount:1}),
  action('submitCountDialog',{value:1}),
  action('togglePrayer',{prayerIndex:1})
 ];
 for(const a of cases)assert.throws(()=>mapSdkAction(a,bad),/refused/,a.type);
});
test('native 377 WordPack is not a plaintext guess and rejects lossy inputs',()=>{
 assert.deepEqual([...packWord377('hello')],[0x61,0xbb,0x40]);
 assert.equal(nameToBase37('bob'),3295n);
 assert.equal(buildAction({type:'chat_plain',message:'Hello'}).opcode,49);
 const pm=buildAction({type:'private_chat',targetName:'bob',message:'Hi'});
 assert.equal(pm.opcode,227);assert.equal(pm.body.readBigUInt64BE(0),3295n);
 for(const message of ['','🚀','a'.repeat(81)])
  assert.throws(()=>packWord377(message));
 assert.throws(()=>nameToBase37('A@B'));
});
test('pinned native 377 fields and alt transforms match decoders (not invented)',()=>{
 const u=(type,args)=>buildAction({type,...args});
 const inv=u('item_on_item',{sourceItemId:1925,sourceSlot:0,
  targetItemId:316,targetSlot:1,componentId:3214});
 assert.equal(inv.opcode,1);assert.equal(inv.body.length,12);
 assert.deepEqual(inv.body.subarray(0,2),Buffer.from([1,60]));
 assert.deepEqual(inv.body.subarray(2,4),p2alt1(0));
 assert.deepEqual(inv.body.subarray(4,6),p2alt1(1925));
 assert.deepEqual(inv.body.subarray(6,8),p2alt3(3214));
 assert.deepEqual(inv.body.subarray(8,10),p2alt2(1));
 assert.deepEqual(inv.body.subarray(10,12),p2alt2(3214));
 const player=u('player',{playerSlot:19,option:2});
 assert.equal(player.opcode,233);assert.deepEqual(player.body,p2alt2(19));
 const spell=u('spell_on_npc',{spellComponent:112,npcSlot:12});
 assert.equal(spell.opcode,104);
 assert.deepEqual(spell.body.subarray(0,2),p2alt2(112));
 assert.deepEqual(spell.body.subarray(2,4),p2alt1(12));
 const count=u('resume_count',{value:42});
 assert.equal(count.opcode,75);assert.deepEqual([...count.body],[0,0,0,42]);
 assert.throws(()=>u('resume_count',{value:-1}));
 assert.throws(()=>u('item_on_item',{sourceItemId:1925,sourceSlot:0,targetItemId:316,
  targetSlot:1,componentId:3214,privileged:true}));
});

test('all extended item/player/spell packet bodies decode against original 377 field layouts',()=>{
 const decode=(buf,kind)=>{
  if(kind==='normal')return buf.readUInt16BE(0);
  if(kind==='a1')return (buf[1]<<8)|buf[0];
  if(kind==='a2')return (buf[0]<<8)|((buf[1]-128)&255);
  if(kind==='a3')return (buf[1]<<8)|((buf[0]-128)&255);
  throw new Error('unexpected transform');
 };
 const get=(buf,offset,kind)=>decode(buf.subarray(offset,offset+2),kind);
 const cases=[
  ['item_on_npc',{npcSlot:12,itemId:1925,slot:3,componentId:3214},
   57,[[0,'normal',12],[2,'a1',1925],[4,'a3',3214],[6,'normal',3]]],
  ['spell_on_player',{playerSlot:19,spellComponent:112},
   31,[[0,'normal',19],[2,'a1',112]]],
  ['spell_on_item',{itemId:1925,slot:3,componentId:3214,spellComponent:112},
   36,[[0,'normal',112],[2,'a2',3214],[4,'a2',3],[6,'a2',1925]]],
  ['spell_on_ground',{x:3221,z:3218,itemId:1925,spellComponent:112},
   83,[[0,'a1',1925],[2,'normal',3218],[4,'a1',112],[6,'a3',3221]]],
  ['item_on_item',{sourceItemId:1925,sourceSlot:3,targetItemId:316,targetSlot:4,componentId:3214},
   1,[[0,'normal',316],[2,'a1',3],[4,'a1',1925],[6,'a3',3214],[8,'a2',4],[10,'a2',3214]]]
 ];
 for(const [type,args,opcode,layout] of cases){
  const pkt=buildAction({type,...args});
  assert.equal(pkt.opcode,opcode,type);
  assert.equal(pkt.body.length,layout.length*2,type);
  for(const [offset,kind,value] of layout)
   assert.equal(get(pkt.body,offset,kind),value,type+' at byte '+offset);
 }
 for(const [i,alt] of ['a3','a2','a1','a1','a2'].entries()){
  const pkt=buildAction({type:'player',playerSlot:19,option:i+1});
  assert.equal(get(pkt.body,0,alt),19,'OPPLAYER option '+(i+1));
 }
 const simple=buildAction({type:'if_button',componentId:5609});
 assert.equal(simple.opcode,79);assert.equal(get(simple.body,0,'normal'),5609);
 const modal=buildAction({type:'close_modal'});
 assert.equal(modal.opcode,110);assert.equal(modal.body.length,0);
 const publicChat=buildAction({type:'chat_plain',message:'hello'});
 assert.equal(publicChat.opcode,49);
 assert.deepEqual([...publicChat.body],[0,0,0x61,0xbb,0x40]);
 const privateChat=buildAction({type:'private_chat',targetName:'bob',message:'hello'});
 assert.equal(privateChat.opcode,227);
 assert.equal(privateChat.body.readBigUInt64BE(0),3295n);
 assert.deepEqual([...privateChat.body.subarray(8)],[0x61,0xbb,0x40]);
});
