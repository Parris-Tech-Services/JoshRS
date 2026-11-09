/**
 * Cook's Assistant: an end-to-end normal-gameplay ATTEMPT for an authenticated
 * disposable rev377 BotSDK character, not a fabricated completion.
 *
 * Native Content/377-wip: scripts/quests/quest_cook/scripts/quest_cook.rs2
 *   cookquest 0 -> 1 -> cook_complete (2), egg + bucket_milk + pot_flour,
 *   300 Cooking XP, 1 quest point. Any unavailable NPC/loc/state blocks.
 *
 * Uses ordinary original BotActions. Never writes quest variables, inventories,
 * XP, saves, teleports or admin state. Source path is NOT live gameplay proof.
 */
const COOK=[3209,3214], EGG=[3231,3295], COW=[3253,3270];
const WHEAT=[3165,3298], MILL=[3165,3306];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function stage(state){
 const x=state?.joshrsQuestStages?.cook;
 if(Number.isSafeInteger(x)&&x>=0)return x;
 if(x&&typeof x==='object'&&!Array.isArray(x)){
  for(const key of ['cookquest','varp','stage'])if(Number.isSafeInteger(x[key])&&x[key]>=0)return x[key];
 }
 return null;
}
export function item(state,re){
 return (state?.inventory??[]).find(x=>typeof x.name==='string'&&re.test(x.name.trim()))??null;
}
export function cookingXp(state){
 const skill=(state?.skills??[]).find(x=>x.name?.toLowerCase()==='cooking');
 return Number.isFinite(skill?.experience)?skill.experience:null;
}
const near=(locs,re)=>(locs??[]).filter(x=>typeof x?.name==='string'&&re.test(x.name.trim()));
async function wait(sdk,predicate,ms=10000){
 if(predicate(sdk.getState()))return true;
 if(typeof sdk.waitForCondition==='function'){
  try{await sdk.waitForCondition(predicate,ms);return predicate(sdk.getState())}catch{return false}
 }
 const end=Date.now()+ms;
 while(Date.now()<end){await sleep(200);if(predicate(sdk.getState()))return true}
 return false;
}
function position(s){return s?.player}
function distance(p,x,z){return p?Math.max(Math.abs(p.worldX-x),Math.abs(p.worldZ-z)):Infinity}
async function walk(sdk,bot,x,z,tolerance=3){
 if(distance(position(sdk.getState()),x,z)<=tolerance)return true;
 const outcome=await bot.walkTo(x,z,tolerance,{timeout:120000});
 if(outcome?.success!==true)return false;
 return wait(sdk,s=>s?.inGame===true&&distance(position(s),x,z)<=tolerance,8000);
}
async function groundPickup(sdk,bot,loc,re,ms=10000){
 if(item(sdk.getState(),re))return true;
 if(!await walk(sdk,bot,...loc,4))return false;
 const present=await wait(sdk,s=>near(s?.groundItems,re).length>0,ms);
 if(!present)return false;
 const found=near(sdk.getState()?.groundItems,re)[0];
 const result=await bot.pickupItem(found);
 if(result?.success!==true)return false;
 return wait(sdk,s=>Boolean(item(s,re)),8000);
}
function live(sdk,name){
 const s=sdk.getState();
 if(s?.inGame!==true||s?.player?.name!==name||!Number.isSafeInteger(s.tick))
  throw new Error('authenticated_quest_bot_state_lost');
 return s;
}
async function choose(sdk,recordAction,re){
 if(!await wait(sdk,s=>s?.dialog?.isOpen&&s.dialog.options?.some(o=>re.test(o.text)),10000))
  return false;
 const result=await sdk.clickDialogByText(re);
 // This is the native 377 gateway effect receipt, not a claimed dispatch.
 recordAction(result);
 return true;
}
async function start(sdk,bot,name,recordAction){
 if(stage(live(sdk,name))!==0)return stage(live(sdk,name))===1;
 if(!await walk(sdk,bot,...COOK,4))return false;
 const found=near(live(sdk,name).nearbyNpcs,/^cook$/i);
 if(found.length!==1)return false;
 const talk=await sdk.sendTalkToNpc(found[0].index);
 recordAction(talk);
 if(!await choose(sdk,recordAction,/what.s wrong/i))return false;
 if(!await choose(sdk,recordAction,/yes,? i.ll help you/i))return false;
 return wait(sdk,s=>stage(s)===1,12000);
}
async function milk(sdk,bot){
 if(item(sdk.getState(),/^bucket of milk$/i))return true;
 if(!item(sdk.getState(),/^bucket$/i))return false;
 if(!await walk(sdk,bot,...COW,4))return false;
 const cows=near(sdk.getState()?.nearbyNpcs,/^(dairy )?cow$/i);
 if(!cows.length)return false;
 const result=await bot.useItemOnNpc(/^bucket$/i,cows[0]);
 return result?.success===true&&await wait(sdk,s=>Boolean(item(s,/^bucket of milk$/i)),10000);
}
async function wheat(sdk,bot){
 if(item(sdk.getState(),/^grain$/i)||item(sdk.getState(),/^pot of flour$/i))return true;
 if(!await walk(sdk,bot,...WHEAT,4))return false;
 const locs=near(sdk.getState()?.nearbyLocs,/^wheat$/i);
 for(const loc of locs.slice(0,6)){
  if(!loc.options?.some(o=>/^pick$/i.test(o)))continue;
  const result=await bot.interactLoc(loc,/^pick$/i);
  if(result?.success===true&&await wait(sdk,s=>Boolean(item(s,/^grain$/i)),7000))return true;
 }
 return false;
}
async function mill(sdk,bot){
 if(item(sdk.getState(),/^pot of flour$/i))return true;
 if(!item(sdk.getState(),/^grain$/i)||!item(sdk.getState(),/^pot$/i))return false;
 if(!await walk(sdk,bot,...MILL,4))return false;
 for(let level=1;level<=2;level++){
  const r=await bot.interactLoc(/^ladder$/i,/climb-?up/i);
  if(r?.success!==true||!await wait(sdk,s=>s?.player?.level===level,10000))return false;
 }
 const hopper=near(sdk.getState()?.nearbyLocs,/hopper/i).find(x=>x.options?.length);
 if(!hopper)return false;
 const added=await bot.useItemOnLoc(/^grain$/i,hopper);
 if(added?.success!==true||!await wait(sdk,s=>!item(s,/^grain$/i),9000))return false;
 const control=near(sdk.getState()?.nearbyLocs,/hopper controls|hopper control/i)
  .find(x=>x.options?.some(o=>/operate|pull/i.test(o)));
 if(!control)return false;
 if((await bot.interactLoc(control,/operate|pull/i))?.success!==true)return false;
 for(let level=1;level>=0;level--){
  const r=await bot.interactLoc(/^ladder$/i,/climb-?down/i);
  if(r?.success!==true||!await wait(sdk,s=>s?.player?.level===level,10000))return false;
 }
 const bin=near(sdk.getState()?.nearbyLocs,/flour bin/i).find(x=>x.options?.length);
 if(!bin)return false;
 const option=bin.options.find(o=>/empty|take/i.test(o));
 if(!option)return false;
 const result=await bot.interactLoc(bin,new RegExp(option,'i'));
 return result?.success===true&&await wait(sdk,s=>Boolean(item(s,/^pot of flour$/i)),10000);
}
function outcome(blocker,observed=false){return {blocked:true,reason:blocker,observed}}
export async function run({sdk,bot,quest,recordAction}){
 if(quest?.id!=='cook')throw new Error('wrong_quest_playbook');
 if(!sdk||!bot||typeof recordAction!=='function')throw new Error('real_sdk_actions_required');
 const initial=live(sdk,sdk.getState()?.player?.name);
 const name=initial.player.name;
 if(!/^Harness[A-Za-z0-9_-]{1,10}$/.test(name))throw new Error('separate_quest_bot_required');
 const initialStage=stage(initial),xpBefore=cookingXp(initial);
 if(initialStage===null)return outcome('native_cook_stage_not_observed');
 if(initialStage===2)return outcome('already_complete_before_run_not_new_playthrough');
 if(initialStage!==0&&initialStage!==1)return outcome('unrecognised_native_cook_stage');
 if(initialStage===0&&!await start(sdk,bot,name,recordAction))
  return outcome('cook_dialogue_or_quest_acceptance_not_verified');
 if(!await groundPickup(sdk,bot,COOK,/^pot$/i,5000))
  return outcome('ordinary_pot_missing_use_native_ground_or_bank');
 if(!await groundPickup(sdk,bot,COOK,/^bucket$/i,5000)&&
    !item(sdk.getState(),/^bucket of milk$/i))
  return outcome('ordinary_bucket_missing_use_native_ground_or_bank');
 if(!await groundPickup(sdk,bot,EGG,/^egg$/i))
  return outcome('egg_not_obtained_through_normal_pickup');
 if(!await milk(sdk,bot))return outcome('dairy_cow_milking_not_verified');
 if(!await wheat(sdk,bot))return outcome('wheat_not_collected');
 if(!await mill(sdk,bot))return outcome('windmill_flour_not_produced');
 const prepared=live(sdk,name);
 if(!item(prepared,/^egg$/i)||!item(prepared,/^bucket of milk$/i)||!item(prepared,/^pot of flour$/i))
  return outcome('three_cook_ingredients_not_in_inventory');
 if(!await walk(sdk,bot,...COOK,4))return outcome('cannot_return_to_cook');
 const chefs=near(live(sdk,name).nearbyNpcs,/^cook$/i);
 if(chefs.length!==1)return outcome('cook_not_uniquely_visible_at_handin');
 const response=await sdk.sendTalkToNpc(chefs[0].index);
 recordAction(response);
 if(!await wait(sdk,s=>stage(s)===2,20000))
  return outcome('cook_handin_did_not_complete_native_quest');
 const result=live(sdk,name),xpAfter=cookingXp(result);
 if(xpBefore===null||xpAfter===null||xpAfter-xpBefore<300)
  return outcome('quest_stage_complete_but_300_cooking_xp_not_verified',true);
 if(item(result,/^egg$/i)||item(result,/^bucket of milk$/i)||item(result,/^pot of flour$/i))
  return outcome('quest_stage_complete_but_ingredients_not_consumed',true);
 // Never claim verified playable: normal logout/relogin, reward-once and
 // actual user Java client confirmation remain required.
 return {observed:true,completionStageObserved:true,cookingXpGained:xpAfter-xpBefore,
  needs:['native_logout_relogin','reward_once','client_journal_and_qp']};
}
