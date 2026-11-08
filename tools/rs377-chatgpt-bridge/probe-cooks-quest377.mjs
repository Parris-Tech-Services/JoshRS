/** CI-only: normal authenticated 377 Cook's Assistant start, not a fake quest setter.
 * Use only the bot's actually visible NPC and native dialogue component IDs.
 * A successful packet dispatch is not completion; quest stage must change.
 */
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const refuse=msg=>{throw new Error('CookQuest377: '+msg)};
const fresh=async reader=>{
 for(let trial=0;trial<12;trial++){
   await pause(670);
   try{return await reader.observe()}
   catch(e){if(!String(e.message).includes('replayed_native_observation'))throw e;}
 }
 refuse('native_tick_did_not_advance');
};
export async function runCookQuestStart377({session,reader}={}){
 if(process.env.RS377_LIVE_BOT_PROBE!=='true'||
    process.env.RS377_OBSERVER_ISOLATED!=='true'||
    process.env.NODE_PROFILE!=='joshrs_ci_377'||process.env.NODE_PORT!=='15402')
   refuse('disposable_isolated_CI_only');
 if(!session?.status()?.authenticated||!reader?.observe)refuse('authenticated_native_bot_required');
 let start=await fresh(reader);
 if(start.world?.revision!==377||start.world?.mode!=='isolated'||
    start.player?.username!=='HarnessProbe')refuse('wrong_native_engine_or_bot');
 if(start.questStages?.cook!==0)refuse('cook_quest_did_not_start_at_stage_zero');
 const actions=[];
 const snapshot=async()=>fresh(reader);
 let visible=(s)=>s.nearbyNpcs?.find(n=>n.id===278&&
   Array.isArray(n.optionsWithIndex)&&n.optionsWithIndex.some(o=>o.opIndex===1));
 let cook=visible(start);
 if(!cook){
   // Ordinary game packet movement; long journeys must be split into
   // legitimate <104-tile clicks. No teleport, database write or coordinates
   // injected into the server. Every progress claim uses fresh native state.
   const destinations=[[3213,3218],[3210,3216]];
   for(const [tx,tz] of destinations){
     for(let leg=0;leg<16;leg++){
       const before=await snapshot();
       cook=visible(before);
       if(cook)break;
       const dx=tx-before.position.x,dz=tz-before.position.z;
       const distance=Math.max(Math.abs(dx),Math.abs(dz));
       if(distance<=8)break;
       const fraction=Math.min(1,80/distance);
       const x=Math.round(before.position.x+dx*fraction);
       const z=Math.round(before.position.z+dz*fraction);
       if(Math.max(Math.abs(x-before.position.x),Math.abs(z-before.position.z))>104)
         refuse('unsafe_normal_click_distance');
       session.send({type:'walk',x,z,running:false});
       actions.push('normal_377_world_map_walk');
       let advanced=false;
       for(let tick=0;tick<28;tick++){
         const now=await snapshot();
         cook=visible(now);
         if(cook)break;
         if(Math.max(Math.abs(now.position.x-before.position.x),
                     Math.abs(now.position.z-before.position.z))>=4){
           advanced=true;break;
         }
       }
       if(cook)break;
       if(!advanced)refuse('no_normal_route_progress_from_'+
         before.position.x+'_'+before.position.z+'_to_'+x+'_'+z);
     }
     if(cook)break;
   }
 }
 if(!cook){
   const final=await snapshot();
   // Only public, already-visible NPC IDs for this isolated bot; never
   // serialize account details, player identities or raw engine data.
   refuse('cook_id_278_not_visible_at_lumbridge_kitchen_'+JSON.stringify({
     x:final.position.x,z:final.position.z,
     visibleNpcIds:(final.nearbyNpcs??[]).slice(0,16).map(n=>n.id),
     cookVisibleWithoutTalk:(final.nearbyNpcs??[]).some(n=>n.id===278)
   }));
 }
 let before=await fresh(reader);
 if(before.questStages?.cook!==0)refuse('cook_stage_mutated_before_talk');
 // The server routes the click with ordinary NPC interaction and collision.
 session.send({type:'npc',npcSlot:cook.index,option:1});
 actions.push('native_talk_to_cook_278');
 let lastPage='';
 let resumes=0;
 let sawRealDialogue=false;
 for(let i=0;i<48;i++){
   const now=await snapshot();
   if(now.questStages?.cook===1){
     return Object.freeze({quest:'cooks_assistant',revision:377,
       before:0,after:1,observedNativeQuestStageChange:true,
       npcInteractionPacketDispatched:true,nativeDialogueObserved:sawRealDialogue,
       dialogueContinuePackets:resumes,normalMovementOnly:true,
       zeroPrivilegedStateWrites:true,realQuestCompletion:false});
   }
   if(now.questStages?.cook!==0)refuse('unexpected_cook_quest_stage');
   const dialogue=now.dialogue;
   if(dialogue?.isOpen||dialogue?.isWaiting)sawRealDialogue=true;
   const pending=dialogue?.pendingComponentIds??[];
   if(!Array.isArray(pending)||!pending.length)continue;
   // The original 377 Cook start accepts its first-option choices:
   // "What's wrong?" followed by "Yes, I'll help you."
   // Only click native server-advertised resume buttons, NEVER hardcoded UI.
   const sig=dialogue.pageId??[...pending].join(',');
   if(sig===lastPage)continue;
   const selected=pending[0];
   if(!Number.isInteger(selected)||selected<0||selected>65535)
     refuse('invalid_server_dialogue_resume_component');
   session.send({type:'dialog_resume',componentId:selected});
   resumes++;
   actions.push('native_dialogue_resume_from_server');
   lastPage=sig;
   if(resumes>18)refuse('unexpected_dialogue_loop');
 }
 refuse('cook_quest_start_unobserved_after_native_interactions_'+
   JSON.stringify({observedDialogue:sawRealDialogue,resumePackets:resumes,
     actionCount:actions.length}));
}
