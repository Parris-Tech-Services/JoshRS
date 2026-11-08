/**
 * Real Barcrawl agent for a single isolated, authentic revision-377 login.
 * ONLY ordinary unmodified upstream RS-SDK actions. No privileged teleport,
 * give coins, set quest varp, poke world state, write save or synthetic trace.
 *
 * The agent handles the ten physical pub interactions when their actual NPCs
 * are visible. It does not invent cross-region paths/boat journeys. A full
 * ten-pub quest is only completed when every actual native signature is seen.
 *
 * Original NPC IDs: LostCityRS/Content@44eab09... pack/npc.pack
 * Signature bits: scripts/quests/quest_barcrawl/configs/quest_barcrawl.constant
 * Bar costs: exact 377 script handlers pinned by barcrawl QA.
 */
import {createEngine377Observer} from '../rs377-chatgpt-bridge/src/engine-observer.mjs';

const pubData=[
 ['Blue Moon Inn',3,733,50],
 ["Blurberry's Bar",4,848,10],
 ["Dead Man's Chest",5,735,15],
 ['Dragon Inn',6,739,12],
 ['Flying Horse Inn',7,738,8],
 ["Foresters' Arms",8,737,18],
 ['Jolly Boar Inn',9,731,10],
 ['Karamja Spirits Bar',10,568,7],
 ['Rising Sun Inn',11,736,70],
 ['Rusty Anchor Inn',12,734,8]
];
const pubs=Object.freeze(pubData.map(([name,bit,npc,cost])=>
 Object.freeze({name,bit,npc,cost})));
const ALL_MASK=pubs.reduce((m,x)=>m|(1<<x.bit),0);
const fail=(reason,record={})=>{
 const error=new Error('REAL_377_BARCRAWL_BLOCKED:'+reason);
 error.details=record;throw error;
};
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
const int=(name)=>{const x=Number(process.env[name]);if(!Number.isSafeInteger(x))fail('missing_'+name);return x};
const botName=()=>process.env.RS377_OBSERVER_BOT;
const has=(bits,idx)=>Boolean(bits&(1<<idx));
const coins=s=>Array.isArray(s.inventory)?
 s.inventory.filter(x=>x.id===995).reduce((n,x)=>n+x.count,0):null;
const card=s=>Array.isArray(s.inventory)&&s.inventory.find(i=>/^barcrawl card$/i.test(i.name||''));
const stage=s=>Number.isSafeInteger(s.questStages?.barcrawl)?s.questStages.barcrawl:null;
function consistent(s,world,bot){
 if(s.world?.revision!==377||s.world.mode!=='isolated'||
    s.world.instanceId!==world||s.player?.username!==bot||
    !s.player.isBot||s.world.tickMs!==600||s.world.xpMultiplier!==1)
   fail('incorrect_world_or_account');
 if(stage(s)===null||coins(s)===null)fail('native_quest_varp_or_inventory_not_observed');
}
async function newer(observer,tick,{attempts=50}={}){
 for(let i=0;i<attempts;i++){
  try{
   const s=await observer.observe();
   if(s.tick>tick)return s;
  }catch(err){
   if(!/replayed_native_observation/.test(String(err.message)))throw err;
  }
  await sleep(650);
 }
 fail('native_game_ticks_not_advancing');
}
async function waitSignature(observer,prev,info){
 let now=prev;
 for(let i=0;i<30;i++){
  now=await newer(observer,now.tick);
  const before=stage(prev),after=stage(now);
  const added=(after&ALL_MASK)&~(before&ALL_MASK);
  if(added){
   if(added!==(1<<info.bit))fail('unrelated_or_multiple_signature_bits_changed',
     {expected:info.name,added});
   if((after&((1<<info.bit)))===0)fail('expected_signature_missing');
   if(coins(prev)-coins(now)<info.cost)
    fail('signature_changed_without_paying_drink_price',
      {pub:info.name,cost:info.cost,before:coins(prev),after:coins(now)});
   return now;
  }
  if((after&ALL_MASK)!==(before&ALL_MASK))
   fail('unexpected_quest_signature_regression');
 }
 fail('pub_script_did_not_set_native_bar_signature',{pub:info.name});
}

export async function run({sdk,bot}){
 const identity=botName(),world=process.env.RS377_OBSERVER_WORLD;
 if(!/^Harness[A-Za-z0-9_-]{1,10}$/.test(identity??'')||
    !/^isolated-[a-z0-9_-]{4,64}$/i.test(world??'')||
    process.env.RS377_OBSERVER_ISOLATED!=='true'||
    process.env.NODE_PROFILE!=='joshrs_ci_377')
   fail('non_disposable_bot_or_world');
 if(!sdk?.isAuthenticated?.()||!bot||
    typeof sdk.sendUseItemOnNpc!=='function'||
    typeof bot.walkTo!=='function')fail('original_upstream_BotSDK_and_BotActions_required');
 const observer=createEngine377Observer({
  port:int('WEB_MANAGEMENT_PORT'),
  token:process.env.RS377_OBSERVER_TOKEN,
  botName:identity,expectedWorld:world
 });
 let now=await observer.observe();
 consistent(now,world,identity);
 const report={status:'IN_PROGRESS',accountCategory:'isolated_Harness_bot',
  worldId:world,firstTick:now.tick,initialRawVarp:stage(now),
  actualPubSignatures:[],guardHandoff:false,saveRelog:false,
  travelIndependentlyVerified:false,gameClientObserved:true,
  failures:[]};
 const unfinished=pubs.filter(p=>!has(stage(now),p.bit));
 if((stage(now)&3)===0)fail('barcrawl_not_started_by_actual_guard',{report});
 if((stage(now)&3)===2)fail('quest_already_complete_not_fresh_playthrough',{report});
 if(!card(now))fail('barcrawl_card_not_in_native_inventory',{report});
 const countCost=unfinished.reduce((n,x)=>n+x.cost,0);
 if(coins(now)<countCost)
  fail('not_enough_legitimately_held_coins_for_remaining_drinks',
   {needed:countCost,observed:coins(now),report});

 for(const pub of unfinished){
  // Discovery, not teleport. The NPC must really exist in native SDK state.
  let state=sdk.getState();
  if(!state?.inGame||state.player?.name!==identity)
    fail('original_SDK_lost_authentic_game_state',{pub:pub.name,report});
  const nearby=state.nearbyNpcs.find(n=>n.id===pub.npc);
  if(!nearby){
   report.failures.push({pub:pub.name,reason:'npc_not_nearby_no_unverified_teleport'});
   fail('physical_travel_to_'+pub.name.replace(/\W/g,'_')+'_not_demonstrated',{report});
  }
  // Only normal physical travel using the original SDK, if a real NPC is near.
  if(nearby.distance>2){
   const walked=await bot.walkTo(nearby.x,nearby.z,2,{timeout:45000});
   if(!walked?.success)fail('normal_player_walking_blocked',{pub:pub.name,report});
   state=sdk.getState();
  }
  const activeNpc=state.nearbyNpcs.find(n=>n.id===pub.npc);
  if(!activeNpc)fail('npc_vanished_during_ordinary_walk',{pub:pub.name,report});
  const activeCard=state.inventory.find(i=>/^barcrawl card$/i.test(i.name));
  if(!activeCard)fail('card_not_visible_in_upstream_SDK_inventory',{pub:pub.name,report});
  const started=now;
  const clicked=await sdk.sendUseItemOnNpc(activeCard.slot,activeNpc.index);
  if(!clicked?.success||clicked.phase!=='completion')
   fail('native_item_on_npc_not_confirmed',{pub:pub.name,result:clicked,report});
  now=await waitSignature(observer,started,pub);
  consistent(now,world,identity);
  report.actualPubSignatures.push({
   pub:pub.name,bit:pub.bit,npcId:pub.npc,cost:pub.cost,
   sourceTick:started.tick,verifiedTick:now.tick,deltaCoins:coins(started)-coins(now)
  });
 }
 if((stage(now)&ALL_MASK)!==ALL_MASK)
  fail('all_ten_native_bar_signatures_not_confirmed',{report});
 report.status='TEN_NATIVE_PUB_SIGNATURES_OBSERVED';
 // The hand-in is a distinct ordinary guarded dialogue with the guard.
 // It is NOT possible to complete by writing a varp or editing a save.
 // This method never claims guard hand-in, relog or world crossing without
 // independently observed action. Keep the strict acceptance issue open.
 return report;
}
export {pubs,ALL_MASK};
