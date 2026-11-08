/**
 * Genuine SDK campaign coordinator. No quest mutators, teleports, direct
 * varp writes, source-script shims, or inferred successful playthroughs.
 * The only possible actions are explicitly reviewed local playbooks.
 */
import {createHash} from 'node:crypto';

export const STATUS=Object.freeze({
 NO_PLAYBOOK:'BLOCKED_NO_REVIEWED_PLAYBOOK',
 DEPENDENCY:'BLOCKED_UNVERIFIED_DEPENDENCY',
 EXTERNAL:'BLOCKED_UNRESOLVED_PREREQUISITE',
 TELEMETRY:'BLOCKED_NATIVE_QUEST_STATE_NOT_OBSERVED',
 CLIENT:'BLOCKED_AUTHENTICATED_CLIENT_STATE',
 FAILED:'FAILED_NORMAL_GAMEPLAY_ACTION',
 PARTIAL:'PARTIAL_NORMAL_GAMEPLAY_OBSERVED',
 UNTESTED:'RESEARCH_NOT_COMPLETE'
});
function isStage(v){
 return Number.isSafeInteger(v)&&v>=0||
   (v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length>=1&&
   Object.keys(v).length<=8&&Object.values(v).every(x=>Number.isSafeInteger(x)&&x>=0));
}
export function observedQuestStage(state,id){
 const data=state?.joshrsQuestStages;
 if(!data||typeof data!=='object'||Array.isArray(data)||!Object.hasOwn(data,id))
   return {available:false};
 const value=data[id];
 return isStage(value)?{available:true,value:structuredClone(value)}:{available:false};
}
export function verifiedAction(result){
 return result?.success===true&&result.phase==='completion'&&
   result?.data?.verifiedEffect===true;
}
/** Record *only* flags, numeric stage, tick, and boolean evidence. Never save raw game state. */
export function compactSnapshot(state,questId){
 const stage=observedQuestStage(state,questId);
 const tick=Number.isSafeInteger(state?.tick)?state.tick:null;
 return {tick,questVarpObserved:stage.available,
   questVarpValue:stage.available?stage.value:null,
   authenticatedInGame:state?.inGame===true};
}
export function makeCheckpoint({catalogue,plan,username,expectedWorld}){
 if(!catalogue||!Array.isArray(plan)||!/^Harness[A-Za-z0-9_-]{1,10}$/.test(username)||
    !/^isolated-[a-z0-9_-]{4,64}$/i.test(expectedWorld))throw new Error('invalid_disposable_campaign_identity');
 return {
  schema:'joshrs-fedora-rssdk-quest-campaign-v1',
  sourceCatalogSha256:catalogue.sourceDigest,
  worldCategory:'isolated-377-only',
  botIdentityHash:createHash('sha256').update(username).digest('hex').slice(0,16),
  worldIdentityHash:createHash('sha256').update(expectedWorld).digest('hex').slice(0,16),
  questCount:plan.filter(q=>q.kind==='quest').length,
  miniquestCount:plan.filter(q=>q.kind==='miniquest').length,
  actualFullQuestPlaythroughsVerified:0,
  evidenceLevel:'DISPOSABLE_GAME_ACTIONS_ONLY_NO_FULL_QUEST_PROOF',
  records:[],
 };
}
export async function executeCampaign({
 catalogue,plan,sdk,bot,username,worldId,playbooks={},onCheckpoint=async()=>{},maxActionsPerQuest=5
}){
 if(!sdk||!bot||typeof sdk.getState!=='function'||!Array.isArray(plan))
  throw new Error('real_connected_original_sdk_required');
 if(!Number.isSafeInteger(maxActionsPerQuest)||maxActionsPerQuest<1||maxActionsPerQuest>50)
  throw new Error('bounded_actions_required');
 const ledger=makeCheckpoint({catalogue,plan,username,expectedWorld:worldId});
 let validState=sdk.getState();
 if(validState?.inGame!==true||validState?.player?.name!==username||
   !Number.isSafeInteger(validState.tick))
   throw new Error('authenticated_disposable_377_state_not_present');
 const active=new Map();
 for(const quest of plan){
  const entry={
   id:quest.id,kind:quest.kind,name:quest.name,
   sourceStatus:quest.sourceStatus,sourceVarps:[...quest.sourceVarps],
   prerequisites:quest.prerequisites,status:STATUS.UNTESTED,
   gameplayActions:0,realClientPlaythroughVerified:false,
   before:null,after:null,reason:null
  };
  const before=sdk.getState();
  if(!before||before.inGame!==true||before.player?.name!==username||
     !Number.isSafeInteger(before.tick))
    {entry.status=STATUS.CLIENT;entry.reason='native_sdk_session_or_game_state_lost'}
  else if(quest.unresolvedPrerequisites.length)
    {entry.status=STATUS.EXTERNAL;entry.reason='missing_reference_prerequisite:'+quest.unresolvedPrerequisites.join('; ').slice(0,150)}
  else if(quest.prerequisites.some(id=>active.get(id)!=='VERIFIED_PLAYABLE'))
    {entry.status=STATUS.DEPENDENCY;entry.reason='dependent_quest_not_live_verified'}
  else if(typeof playbooks[quest.id]!=='function')
    {entry.status=STATUS.NO_PLAYBOOK;entry.reason='exact_377_scenario_not_yet_implemented'}
  else {
   entry.before=compactSnapshot(before,quest.id);
   if(!entry.before.questVarpObserved){
    entry.status=STATUS.TELEMETRY;
    entry.reason='native_varp_id_unavailable_or_not_packed';
   }else{
    let calls=0;
    const recordAction=(result)=>{
     calls++;
     if(calls>maxActionsPerQuest)throw new Error('per_quest_action_budget_exceeded');
     if(!verifiedAction(result))throw new Error('normal_game_action_lacks_native_effect_proof');
    };
    try{
     // A local playbook never receives raw passwords, database handles,
     // account management APIs, or privileged scripts. It may call only
     // regular SDK/BotActions within the running isolated session.
     const outcome=await playbooks[quest.id]({
       sdk,bot,quest,before,recordAction
     });
     entry.gameplayActions=calls;
     entry.after=compactSnapshot(sdk.getState(),quest.id);
     if(!outcome?.observed||calls<1||!entry.after.authenticatedInGame||
        entry.after.tick<=entry.before.tick)
       throw new Error('no_independent_post_action_observation');
     entry.status=STATUS.PARTIAL;
     entry.reason='one_or_more_actions_observed_but_quest_completion_and_relog_not_verified';
    }catch(err){
     entry.gameplayActions=calls;
     entry.after=compactSnapshot(sdk.getState(),quest.id);
     entry.status=STATUS.FAILED;
     entry.reason=String(err?.message??err).replace(/[\r\n]/g,' ').slice(0,160);
    }
   }
  }
  active.set(quest.id,entry.status);
  ledger.records.push(entry);
  await onCheckpoint(ledger);
 }
 return ledger;
}
/** Metadata-only dry run. Never claim it sent packets or passed a quest. */
export function dryCampaign(catalogue,plan){
 const ledger=makeCheckpoint({catalogue,plan,username:'HarnessDryRun',expectedWorld:'isolated-dry-run'});
 ledger.evidenceLevel='SOURCE_PLAN_ONLY_NO_GAME_CONNECTED';
 ledger.records=plan.map(q=>({
   id:q.id,kind:q.kind,name:q.name,sourceStatus:q.sourceStatus,
   prerequisites:q.prerequisites,unresolvedPrerequisites:q.unresolvedPrerequisites,
   status:STATUS.UNTESTED,gameplayActions:0,realClientPlaythroughVerified:false
 }));
 return ledger;
}
