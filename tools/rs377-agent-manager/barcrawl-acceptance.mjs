/**
 * Alfred Grimhand's Barcrawl: strict, read-only native rev377 acceptance gate.
 * Input MUST be authenticated disposable-world, per-account observations.
 * No login, game packets, quest writes, teleports, save access or private data.
 * Passing a synthetic UNIT FIXTURE never proves a live playthrough.
 */
export const BARS=Object.freeze([
 Object.freeze({name:'BlueMoon Inn',bit:3}),
 Object.freeze({name:"Blurberry's Bar",bit:4}),
 Object.freeze({name:"Dead Man's Chest",bit:5}),
 Object.freeze({name:'Dragon Inn',bit:6}),
 Object.freeze({name:'Flying Horse Inn',bit:7}),
 Object.freeze({name:'Foresters Arms',bit:8}),
 Object.freeze({name:'Jolly Boar Inn',bit:9}),
 Object.freeze({name:'Karamja Spirits Bar',bit:10}),
 Object.freeze({name:'Rising Sun Inn',bit:11}),
 Object.freeze({name:'Rusty Anchor Inn',bit:12})
]);
const ALL_MASK=BARS.reduce((n,s)=>n|(1<<s.bit),0);
const fail=reason=>{throw new Error('BARCRAWL_ACCEPTANCE_BLOCKED: '+reason)};
const isUInt=n=>Number.isSafeInteger(n)&&n>=0;
export function decodeBarcrawl(raw){
 if(!isUInt(raw)||raw>0x7fffffff)fail('unknown_or_invalid_authoritative_varp');
 const stage=raw&3;
 if(stage>2)fail('invalid_quest_stage');
 return Object.freeze({
  raw,stage,allSigned:(raw&ALL_MASK)===ALL_MASK,
  completed:Object.freeze(BARS.filter(s=>(raw&(1<<s.bit))!==0).map(s=>s.name))
 });
}
const cardPresent=s=>{
 if(!Array.isArray(s.inventory))fail('inventory_not_observable');
 if(s.inventory.length>28)fail('inventory_invalid');
 const slots=new Set();
 for(const item of s.inventory){
  if(!item||!isUInt(item.slot)||item.slot>=28||slots.has(item.slot)||
     !isUInt(item.count)||item.count<1||typeof item.name!=='string')
    fail('inventory_untrusted');
  slots.add(item.slot);
 }
 return s.inventory.some(i=>/^barcrawl card$/i.test(i.name));
};
export function createBarcrawlAcceptance({botName,worldId,sourceSha}={}){
 if(typeof botName!=='string'||!/^Harness[A-Za-z0-9_-]{1,10}$/.test(botName))fail('disposable_Harness_identity_required');
 if(typeof worldId!=='string'||!/^isolated-[a-z0-9_-]{4,64}$/i.test(worldId))fail('isolated_world_required');
 if(typeof sourceSha!=='string'||!/^[0-9a-f]{40}$/i.test(sourceSha))fail('pinned_source_SHA_required');
 let lastSession=null,lastTick=-1,initial=false,cardIssued=false;
 let previous=null,preHandIn=null,handedIn=false,relLogged=false;
 const signatures=new Set(),sessions=new Set(),events=[];
 const observe=({sessionId,snapshot}={})=>{
  if(typeof sessionId!=='string'||!/^session-[a-zA-Z0-9_-]{6,64}$/.test(sessionId))fail('authenticated_session_identity_missing');
  const s=snapshot;
  if(!s||s.player?.username!==botName||s.player?.isBot!==true||
     s.world?.mode!=='isolated'||s.world?.revision!==377||
     s.world?.instanceId!==worldId||s.world?.sourceSha!==sourceSha||
     s.world?.tickMs!==600||s.world?.xpMultiplier!==1)
    fail('wrong_world_or_account');
  if(!isUInt(s.tick))fail('missing_native_tick');
  if(sessionId===lastSession){
   if(s.tick<=lastTick)fail('stale_or_replayed_tick');
  } else {
   if(sessions.has(sessionId))fail('reused_login_session');
   if(lastSession!==null&&!handedIn)fail('relogged_before_verified_handoff');
   sessions.add(sessionId);
  }
  const cur=decodeBarcrawl(s.questStages?.barcrawl);
  const card=cardPresent(s);
  if(!initial){
   if(cur.stage!==0||cur.completed.length!==0||card)fail('test_account_not_fresh');
   initial=true;events.push('fresh_account_observed');
  } else if(!cardIssued){
   if(cur.stage===0){if(card)fail('card_before_guard_start');}
   else if(cur.stage===1&&card&&!cur.completed.length){cardIssued=true;events.push('guard_issued_card');}
   else fail('guard_start_not_verified');
  } else if(!handedIn){
   if(cur.stage!==1&&cur.stage!==2)fail('unexpected_stage_during_progress');
   if(previous&&((cur.raw&ALL_MASK)&~(previous.raw&ALL_MASK))!==0){
    const newNames=BARS.filter(b=>(cur.raw&(1<<b.bit))&&!(previous.raw&(1<<b.bit))).map(b=>b.name);
    if(newNames.length!==1)fail('more_than_one_signature_changed_in_one_tick');
    signatures.add(newNames[0]);events.push('signed:'+newNames[0]);
   }
   if(previous&&((previous.raw&ALL_MASK)&~(cur.raw&ALL_MASK))!==0)fail('signed_progress_regressed');
   if(cur.stage===2){
    if(!cur.allSigned||signatures.size!==10)fail('handoff_without_ten_observed_signatures');
    if(card)fail('card_still_in_inventory_after_handoff');
    preHandIn=lastSession;handedIn=true;events.push('guard_handoff_observed');
   } else if(!card)fail('lost_card_during_unsigned_progress');
  } else {
   if(cur.stage!==2||!cur.allSigned||card)fail('completion_did_not_persist');
   if(sessionId!==preHandIn){relLogged=true;events.push('relogin_persisted');}
  }
  previous=cur;lastSession=sessionId;lastTick=s.tick;
  return report();
 };
 function report(){
  return Object.freeze({
   status:relLogged?'trace_contract_passed_provenance_not_attested':'incomplete',
   passed:relLogged,stage:previous?.stage??null,
   signatures:Object.freeze([...signatures]),
   guardIssuedCard:cardIssued,handedIn,relogPersisted:relLogged,
   observedSessions:sessions.size,events:Object.freeze([...events]),
   // Native source authentication and ordinary login MUST be verified separately.
   liveWindowsPlaythroughVerified:false
  });
 }
 return Object.freeze({observe,report});
}
