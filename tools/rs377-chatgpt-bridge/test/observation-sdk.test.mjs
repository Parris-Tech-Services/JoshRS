import test from 'node:test';
import assert from 'node:assert/strict';
import {SKILLS377,validateObservation,createObserver} from '../src/observation.mjs';
import {mapSdkAction,toBotWorldState} from '../src/sdk-bridge.mjs';
const sourceSha='b5ac859b47915afb545e60e4c1208f25d43cb3fb';
function raw() {return {
  world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:'isolated-test-world',sourceSha},
  player:{username:'HarnessBot',isBot:true},tick:100,
  position:{x:3222,z:3218,plane:0},
  skills:SKILLS377.map(name=>({name,level:name==='Hitpoints'?10:1,baseLevel:name==='Hitpoints'?10:1,xpTenths:name==='Hitpoints'?11540:0})),
  inventory:[{slot:0,id:1925,count:1,name:'Bucket',optionsWithIndex:[]}],equipment:[],
  nearbyNpcs:[{index:12,id:7,x:3223,z:3218,name:'Cook',kind:'npc',optionsWithIndex:[{text:'Talk-to',opIndex:1}]}],
  nearbyLocs:[{id:10,x:3221,z:3217,level:0,name:'Tree',optionsWithIndex:[{text:'Chop',opIndex:1}]}],
  groundItems:[{id:1925,x:3220,z:3218,name:'Bucket',distance:2}],
  dialogue:{isOpen:false,options:[],isWaiting:false},
  questStages:{cooks_assistant:0},sdkDetails:null
}}
const opts={botName:'HarnessBot',expectedWorld:'isolated-test-world'};
test('observer validates tick, unique bot identity, 600ms and 1x XP and exact source SHA',()=>{
  let x=validateObservation(raw(),opts);
  assert.equal(x.player.username,'HarnessBot');
  assert.deepEqual(x.unsupported,['sdkDetails']);
  const bad=raw();bad.world.xpMultiplier=2;assert.throws(()=>validateObservation(bad,opts),/normal speed/);
  const other=raw();other.player.username='Elrothiro';assert.throws(()=>validateObservation(other,opts),/identity/);
  const wrong=raw();wrong.world.instanceId='isolated-different';assert.throws(()=>validateObservation(wrong,opts),/wrong world/);
});
test('read-only snapshots are detached and frozen, no mutable server reference leakage',async()=>{
  let backing=raw();let read=0;
  const o=createObserver(async()=>{read++;return backing},opts);
  const s=await o.observe();assert.equal(Object.isFrozen(s.world),true);
  assert.throws(()=>{s.inventory[0].count=300});backing.inventory[0].count=2;
  assert.equal(s.inventory[0].count,1);await o.observe();assert.equal(read,2);
  backing.tick=99;await assert.rejects(()=>o.observe(),/decreased/);
});
test('observer denies accidental cross-player or private data fields',()=>{
  const other=raw();other.nearbyPlayers=[{username:'Sylvie',bank:[]}];
  assert.throws(()=>validateObservation(other,opts),/unexpected top-level/);
  const world=raw();world.world.privateKey='secret';assert.throws(()=>validateObservation(world,opts),/unexpected world/);
  const player=raw();player.player.email='secret';assert.throws(()=>validateObservation(player,opts),/private fields/);
});
test('unknown game telemetry must be explicit null and never invented SDK state',()=>{
  const b=raw();b.inventory=null;
  const o=validateObservation(b,opts);
  assert.ok(o.unsupported.includes('inventory'));
  assert.throws(()=>toBotWorldState(o,opts),/incomplete/);
  assert.throws(()=>toBotWorldState(raw(),opts),/sdkDetails/);
});
test('maps visible 377 normal actions only and preserves source exact opcodes',()=>{
  const o=validateObservation(raw(),opts);
  let r=mapSdkAction({type:'walkTo',x:3223,z:3219,running:false,reason:'Go'},o);
  assert.equal(r.packet.opcode,28);assert.equal(r.result,'dispatched_unverified');
  assert.equal(mapSdkAction({type:'interactNpc',npcIndex:12,optionIndex:1,reason:'Talk'},o).packet.opcode,112);
  assert.equal(mapSdkAction({type:'interactLoc',x:3221,z:3217,locId:10,optionIndex:1,reason:'Chop'},o).packet.opcode,181);
  assert.equal(mapSdkAction({type:'pickupItem',x:3220,z:3218,itemId:1925,reason:'Take'},o).packet.opcode,77);
  assert.equal(mapSdkAction({type:'useItemOnLoc',itemSlot:0,x:3221,z:3217,locId:10,reason:'Use'},o).packet.opcode,152);
  assert.equal(mapSdkAction({type:'useInventoryItem',slot:0,interfaceId:3214,optionIndex:1,reason:'Use'},o).packet.opcode,203);
});
test('rejects not visible, hostile injected actions, arbitrary stage/XP writes, unguarded dialogs',()=>{
  const o=validateObservation(raw(),opts);
  for(const a of [
    {type:'teleport',x:100,reason:'x'},{type:'setVar',id:1,reason:'x'},
    {type:'interactNpc',npcIndex:999,optionIndex:1,reason:'x'},
    {type:'interactLoc',x:1,z:1,locId:10,optionIndex:1,reason:'x'},
    {type:'useInventoryItem',slot:27,optionIndex:1,interfaceId:3214,reason:'x'},
    {type:'clickDialogOption',optionIndex:1,reason:'x'},
    {type:'say',message:'; rm -rf /',reason:'x'},
    {type:'walkTo',x:9000,z:9000,reason:'x'}
  ])assert.throws(()=>mapSdkAction(a,o),/refused/);
});
test('can translate a complete *supplied* SDK-compatible observation but not synthesize missing required data',()=>{
  const x=raw();
  x.nearbyNpcs[0]={...x.nearbyNpcs[0],combatLevel:1,distance:1,hp:null,maxHp:null,
    healthPercent:null,targetIndex:-1,inCombat:false,lastCombatTick:null,
    animId:-1,spotanimId:-1,options:['Talk-to']};
  x.nearbyLocs[0]={...x.nearbyLocs[0],distance:1,options:['Chop']};
  x.groundItems[0]={...x.groundItems[0],count:1};
  x.sdkDetails={
    player:{name:'HarnessBot',combatLevel:3,hp:10,maxHp:10,x:3222,z:3218,
      worldX:3222,worldZ:3218,level:0,runEnergy:100,runWeight:0,animId:-1,
      spotanimId:-1,combat:{inCombat:false,targetIndex:-1,targetType:'none',lastDamageTick:-1},
      isDead:false,lifeId:1,respawnCount:0,lastDeathTick:null},
    nearbyPlayers:[],gameMessages:[],recentDialogs:[],interface:{isOpen:false,interfaceId:-1,options:[]},
    shop:{isOpen:false,title:'',shopItems:[],playerItems:[]},bank:{isOpen:false,items:[],noteMode:false},
    modalOpen:false,modalInterface:0,combatEvents:[],prayers:{activePrayers:Array(15).fill(false),prayerPoints:1,prayerLevel:1}
  };
  const out=toBotWorldState(x,opts);assert.equal(out.state.player.worldX,3222);
  assert.equal(out.state.skills.find(s=>s.name==='Hitpoints').experience,1154);
  assert.equal(out.state.inGame,true);assert.equal(out.state.tick,100);
  const broken=raw();broken.sdkDetails=x.sdkDetails;delete broken.sdkDetails.bank;
  assert.throws(()=>toBotWorldState(broken,opts),/bank/);
});
test('Issue 8: clickDialogOption requires verified optionTextAvailable, pageId, and pendingComponentIds, routing index 0 to DIALOG_RESUME (226) and index 1..5 to IF_BUTTON (79)',()=>{
  const pauseSnap=raw();
  pauseSnap.dialogue={
    isOpen:true,
    isWaiting:true,
    pageId:'dlg-4882-1-10-100',
    options:[{index:0,text:'Click here to continue',componentId:4886}],
    pendingComponentIds:[4886],
    optionTextAvailable:true
  };
  const vPause=validateObservation(pauseSnap,opts);
  const mappedPause=mapSdkAction({
    type:'clickDialogOption',
    optionIndex:0,
    guard:{pageId:'dlg-4882-1-10-100',componentId:4886},
    reason:'Continue pause dialog'
  },vPause);
  assert.equal(mappedPause.packet.opcode,226);

  const multiSnap=raw();
  multiSnap.dialogue={
    isOpen:true,
    isWaiting:true,
    pageId:'dlg-2459-1-20-200',
    options:[
      {index:1,text:'Yes please.',componentId:2461},
      {index:2,text:'No thanks.',componentId:2462}
    ],
    pendingComponentIds:[2461,2462],
    optionTextAvailable:true
  };
  const vMulti=validateObservation(multiSnap,opts);
  const mappedChoice=mapSdkAction({
    type:'clickDialogOption',
    optionIndex:1,
    guard:{pageId:'dlg-2459-1-20-200',componentId:2461},
    reason:'Select option 1'
  },vMulti);
  assert.equal(mappedChoice.packet.opcode,79);

  // Refuse when optionTextAvailable is false (even if options array was populated)
  const unverifiedTextSnap=raw();
  unverifiedTextSnap.dialogue={
    ...multiSnap.dialogue,
    optionTextAvailable:false
  };
  const vUnverified=validateObservation(unverifiedTextSnap,opts);
  assert.throws(()=>mapSdkAction({
    type:'clickDialogOption',
    optionIndex:1,
    guard:{pageId:'dlg-2459-1-20-200',componentId:2461},
    reason:'Unverified option text'
  },vUnverified),/refused/);
});
