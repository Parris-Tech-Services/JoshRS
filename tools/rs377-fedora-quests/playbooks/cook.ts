/**
 * Cook's Assistant REV-377: the first *partial* real-playbook probe.
 * It only invokes the ordinary observed Cook Talk-to action. The quest's
 * egg/milk/flour sequence, reward, complete varp and relog are NOT yet tested.
 */
export async function run({sdk,quest,recordAction}){
 if(quest.id!=='cook')throw new Error('wrong_quest_playbook');
 const state=sdk.getState();
 if(!state?.inGame||!Array.isArray(state.nearbyNpcs))
  return {blocked:true,reason:'no_native_nearby_npcs'};
 const cooks=state.nearbyNpcs.filter(n=>
   typeof n.name==='string'&&/^cook$/i.test(n.name.trim())&&
   Number.isSafeInteger(n.index)&&n.index>=0&&
   Number.isSafeInteger(n.x)&&Number.isSafeInteger(n.z));
 if(cooks.length!==1)return {blocked:true,reason:'cook_not_uniquely_visible_from_current_tile'};
 const npc=cooks[0];
 // Do not claim a quest from a packet send. The gateway must independently
 // corroborate dialogue/quest-state effect before marking this action.
 const result=await sdk.sendTalkToNpc(npc.index);
 recordAction(result);
 const next=sdk.getState();
 return {observed:next?.inGame===true&&
   (next?.dialog?.isOpen===true||
    JSON.stringify(next?.joshrsQuestStages?.cook??null)!==
    JSON.stringify(state?.joshrsQuestStages?.cook??null))};
}
