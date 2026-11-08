/**
 * PINNED UPSTREAM BotSDK CLASS smoke test (synthetic state only).
 *
 * Runs with Bun against MaxBittker/rs-sdk pinned at
 * db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb in an ephemeral CI checkout.
 *
 * This proves typed BotSDK connect/state/action ABI, NOT real rev377 gameplay,
 * a complete native adapter, family-server compatibility or saved progress.
 */
import {strict as assert} from 'node:assert';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createSdk377WebSocket} from '../src/sdk-websocket.mjs';

const upstream=process.argv[2];
if(!upstream)throw new Error('Pinned upstream rs-sdk checkout path required');
const sdkModule=await import(pathToFileURL(resolve(upstream,'sdk/index.ts')).href);
const {BotSDK}=sdkModule;
assert.equal(typeof BotSDK,'function');

const username='HarnessProbe';
const token='upstream-synthetic-token-'+('3'.repeat(48));
const contract='MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const skillNames=['Attack','Defence','Strength','Hitpoints','Ranged','Prayer','Magic',
  'Cooking','Woodcutting','Fletching','Fishing','Firemaking','Crafting',
  'Smithing','Mining','Herblore','Agility','Thieving','Slayer','Farming','Runecraft'];
let tick=0,position={x:3222,z:3218},actions=0;
const runtime={
  async observe(){
    tick++;
    return {tick,position:{...position},world:{instanceId:'isolated-fixture'},
      player:{username}};
  },
  async getSdkState(){
    tick++;
    const skills=skillNames.map(name=>({name,level:1,baseLevel:1,experience:0}));
    return {
      source:{contract,instanceId:'isolated-fixture',tick},
      state:{
        tick,inGame:true,
        player:{
          name:username,combatLevel:3,hp:10,maxHp:10,
          x:position.x,z:position.z,worldX:position.x,worldZ:position.z,
          level:0,runEnergy:100,runWeight:0,animId:-1,spotanimId:-1,
          combat:{inCombat:false,targetIndex:-1,targetType:'none',lastDamageTick:-1},
          isDead:false,lifeId:0,respawnCount:0,lastDeathTick:null
        },
        skills,inventory:[],equipment:[],nearbyNpcs:[],nearbyPlayers:[],
        nearbyLocs:[],groundItems:[],gameMessages:[],recentDialogs:[],
        dialog:{isOpen:false,options:[],isWaiting:false},
        interface:{isOpen:false,interfaceId:-1,options:[]},
        shop:{isOpen:false,title:'',shopItems:[],playerItems:[]},
        bank:{isOpen:false,items:[],noteMode:false},
        modalOpen:false,modalInterface:-1,combatEvents:[],
        prayers:{activePrayers:Array(15).fill(false),prayerPoints:1,prayerLevel:1}
      }
    };
  },
  async action(action){
    actions++;
    if(action.type!=='walkTo')return {status:'no_action',tick};
    position={x:action.x,z:action.z};
    return {status:'dispatched_unverified',opcode:28,tick:++tick};
  }
};
const gateway=createSdk377WebSocket({runtime,botName:username,token,stateIntervalMs:120});
const info=await gateway.listen(0);
const sdk=new BotSDK({
  botUsername:username,password:token,gatewayUrl:'ws://127.0.0.1:'+info.port+'/gateway',
  autoLaunchBrowser:false,autoReconnect:false,readyTimeout:0,connectTimeout:6000,
  actionTimeout:8500,showChat:false
});
try{
  await sdk.connect();
  assert.equal(sdk.isAuthenticated(),true,'real upstream BotSDK should authenticate');
  let first;
  for(let i=0;i<40;i++){
    first=sdk.getState();
    if(first)break;
    await sleep(100);
  }
  assert.ok(first,'real BotSDK must receive an initial sdk_state');
  assert.equal(first.player.name,username);
  assert.equal(first.skills.length,21);
  const firstTick=first.tick;
  let next;
  for(let i=0;i<30;i++){
    next=sdk.getState();
    if(next&&next.tick>firstTick)break;
    await sleep(125);
  }
  assert.ok(next?.tick>firstTick,'BotSDK must see a later REAL (fixture) tick');
  const sent=await sdk.sendWalk(3223,3218,false);
  assert.equal(sent.success,true,'BotSDK action must receive verified completion envelope');
  assert.equal(sent.phase,'completion');
  assert.equal(actions,1);
  assert.deepEqual(position,{x:3223,z:3218});
  console.log(JSON.stringify({
    checked:'actual_upstream_BotSDK_Class_against_377_WebSocket_Adapter',
    origin:'SYNTHETIC_FIXTURE_ONLY',
    pinnedUpstream:'db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb',
    authenticated:true,receivedContinuousState:true,
    actionEnvelopeVerified:true,
    native377GameUsed:false,familyWorldTouched:false,realQuestingVerified:false
  }));
}finally{
  try{
    await sdk.disconnect();
    console.log('CLEANUP: pinned upstream SDK disconnected');
  }finally{
    await gateway.close();
    console.log('CLEANUP: isolated fixture gateway closed');
  }
}
// The upstream SDK installs background lifecycle timers intended for a
// long-running agent. This single-shot CI acceptance has explicitly disconnected
// the SDK and closed its only server; terminate the fixture runner cleanly.
process.exit(0);
