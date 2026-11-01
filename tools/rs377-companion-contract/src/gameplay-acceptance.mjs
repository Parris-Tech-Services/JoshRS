/**
 * Task 36: evidence-driven real-gameplay acceptance contract.
 * NEVER converts a self-labelled JSON trace into proof of a real server.
 * Cross-check evidence with independently captured engine/client/DB logs.
 */
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const countItems=(items,id)=>items.filter(x=>x.id===id).reduce((a,x)=>a+x.count,0);
const inventory=(s,id)=>countItems(s.inventory,id);
const forbidden=new Set(['grant','invAdd','addXp','setVar','teleport','admin','quest_stage_write','synthetic_quest_stage','mock_state']);
const types=new Set(['npc_dialogue_open','npc_dialogue_choice','loc_interaction','item_gathered','bank_deposit','bank_withdraw','logout','relogin','save_verified','quest_hand_in']);
export function checkGameplayAcceptance({snapshots,events,botName,worldId,sourceSha,evidenceOrigin='fixture',logItemId,bankItemId=logItemId,skill='Woodcutting'}={}){
 const failures=[],fail=x=>{if(!failures.includes(x))failures.push(x)};
 if(!Array.isArray(snapshots)||snapshots.length<3||!Array.isArray(events)||!botName||!worldId||
  !/^[0-9a-f]{40}$/.test(sourceSha??'')||!integer(logItemId)||!integer(bankItemId))
  throw Error('explicit bot, source, world, item IDs, snapshots and events required');
 const sorted=[...snapshots].sort((a,b)=>a.tick-b.tick);
 for(const s of sorted){
  if(!integer(s.tick)||s.world?.revision!==377||s.world?.instanceId!==worldId||
   s.world?.sourceSha!==sourceSha||s.world?.tickMs!==600||s.world?.xpMultiplier!==1||
   s.player?.username!==botName||!Array.isArray(s.inventory)||!Array.isArray(s.bank)||
   !s.inventory.every(i=>integer(i.id)&&integer(i.count))||
   !s.bank.every(i=>integer(i.id)&&integer(i.count))||
   !integer(s.skills?.[skill]?.xpTenths)||!integer(s.questStage))
   fail('invalid_or_incomplete_authoritative_snapshot');
 }
 for(let i=1;i<sorted.length;i++)if(sorted[i].tick<=sorted[i-1].tick)fail('non_increasing_server_ticks');
 if(sorted.some(s=>s.source!=='engine-377-authoritative'))fail('non_authoritative_state_source');
 const ev=[...events].sort((a,b)=>a.tick-b.tick);
 if(ev.some(e=>!integer(e.tick)||e.worldId!==worldId||e.bot!==botName||
  !['native-client-377','engine-377-authoritative','java-client-377','db-377-persistence'].includes(e.source)||
  (!types.has(e.type)&&!forbidden.has(e.type))))fail('unrecognised_or_untrusted_event');
 if(ev.some(e=>forbidden.has(e.type)||e.privileged===true||e.synthetic===true))fail('cheat_or_synthetic_event');
 const has=(type,source)=>ev.some(e=>e.type===type&&(!source||e.source===source)&&e.observed===true);
 if(!has('npc_dialogue_open','java-client-377')||!has('npc_dialogue_choice','java-client-377'))
  fail('genuine_npc_dialogue_not_seen_in_client');
 if(!has('loc_interaction','engine-377-authoritative'))fail('normal_object_interaction_not_observed');
 if(!has('item_gathered','engine-377-authoritative'))fail('gathering_not_observed');
 const first=sorted[0],last=sorted.at(-1);
 if(sorted.every(s=>s.skills?.[skill]?.xpTenths<=first.skills?.[skill]?.xpTenths)||
  sorted.every(s=>inventory(s,logItemId)<=inventory(first,logItemId)))
  fail('gathering_requires_real_xp_and_inventory_increase');
 if(!has('bank_deposit','engine-377-authoritative')||!has('bank_withdraw','engine-377-authoritative'))
  fail('normal_bank_deposit_and_withdraw_not_observed');
 if(!sorted.some(s=>countItems(s.bank,bankItemId)>countItems(first.bank,bankItemId)))
  fail('bank_item_delta_not_observed');
 if(!has('logout','native-client-377')||!has('relogin','native-client-377')||
  !has('save_verified','db-377-persistence'))fail('persistent_recovery_not_verified');
 const saved=ev.find(e=>e.type==='save_verified'&&e.observed===true);
 if(!saved||!integer(saved.tick)||saved.tick>last.tick||
  saved.inventoryHash!==last.inventoryHash||saved.bankHash!==last.bankHash||
  saved.skillsHash!==last.skillsHash)fail('post_relogin_persistence_mismatch');
 // Quest-stage values alone are NEVER acceptable; require actual hand-in
 // observed in both native server and independent Java client.
 if(last.questStage>first.questStage&&
  !(has('quest_hand_in','engine-377-authoritative')&&has('quest_hand_in','java-client-377')))
  fail('synthetic_or_unverified_quest_progress');
 if(evidenceOrigin!=='real-runtime-capture')fail('fixture_not_live_runtime_proof');
 return Object.freeze({status:failures.length?'blocked':'capture_assertions_passed_pending_independent_review',
  failures,checks:{npcDialogue:!failures.includes('genuine_npc_dialogue_not_seen_in_client'),
   object:!failures.includes('normal_object_interaction_not_observed'),
   gathering:!failures.includes('gathering_requires_real_xp_and_inventory_increase'),
   banking:!failures.includes('normal_bank_deposit_and_withdraw_not_observed'),
   persistence:!failures.includes('post_relogin_persistence_mismatch')},
  note:'Assertions over supplied captures only; independent runtime/client/database provenance review required.'});
}
