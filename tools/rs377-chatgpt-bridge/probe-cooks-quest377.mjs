/** CI-only: normal authenticated 377 Cook's Assistant start, not a fake quest setter.
 * Use only the bot's actually visible NPC and native dialogue component IDs.
 * A successful packet dispatch is not completion; quest stage must change.
 */
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const refuse=msg=>{throw new Error('CookQuest377: '+msg)};
export async function runCookQuestStart377({session,reader}={}){
 if(process.env.RS377_LIVE_BOT_PROBE!=='true'||
    process.env.RS377_OBSERVER_ISOLATED!=='true'||
    process.env.NODE_PROFILE!=='joshrs_ci_377'||process.env.NODE_PORT!=='15402')
   refuse('disposable_isolated_CI_only');
 if(!session?.status()?.authenticated||!reader?.observe)refuse('authenticated_native_bot_required');
 let start=await reader.observe();
 if(start.world?.revision!==377||start.world?.mode!=='isolated'||
    start.player?.username!=='HarnessProbe')refuse('wrong_native_engine_or_bot');
 if(start.questStages?.cook!==0)refuse('cook_quest_did_not_start_at_stage_zero');
 const actions=[];
 const snapshot=async()=>{await pause(700);return reader.observe()};
 let visible=(s)=>s.nearbyNpcs?.find(n=>n.id===278&&
   Array.isArray(n.options)&&n.options.some(o=>o.opIndex===1));
 let cook=visible(start);
 if(!cook){
   // Normal game-world walking, not a privileged teleport or varp grant.
   // Cook is the *real* NPC 278 in Lumbridge Castle kitchen.
   const targets=[[3213,3218],[3210,3216]];
   for(const [x,z] of targets){
     const position=await snapshot();
     if(Math.max(Math.abs(x-position.position.x),Math.abs(z-position.position.z))>104)
       refuse('cook_out_of_normal_click_range');
     session.send({type:'walk',x,z,running:false});actions.push('walk_to_lumbridge_kitchen');
     for(let tick=0;tick<14;tick++){
       const now=await snapshot();cook=visible(now);
       if(cook)break;
     }
     if(cook)break;
   }
 }
 if(!cook)refuse('cook_id_278_not_visible_at_lumbridge_kitchen');
 let before=await reader.observe();
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
