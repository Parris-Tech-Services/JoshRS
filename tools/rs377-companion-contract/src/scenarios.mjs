/**
 * Task 32: strict no-cheat gathering / later quest acceptance planner.
 * Never synthesises item sources, inventory, XP, quest stages or completion.
 * Inventory and XP must come from a trusted bot-only live observer.
 */
function finiteId(n){return Number.isSafeInteger(n)&&n>=0&&n<=2147483647;}
function countItem(p,id){return (p.inventory??[]).filter(x=>x.id===id).reduce((v,x)=>v+x.quantity,0);}
function valid(snapshot,botName){
  if(!snapshot?.world||snapshot.world.revision!==377||snapshot.world.mode!=='isolated'||
    snapshot.world.tickMs!==600||snapshot.world.xpMultiplier!==1||
    snapshot.player?.username!==botName||snapshot.player?.isBot!==true)
    throw Error('Untrusted, nonisolated or wrong-player observation');
  if(!Number.isSafeInteger(snapshot.tick)||snapshot.tick<0||!Array.isArray(snapshot.player.inventory)||
    !snapshot.player.inventory.every(i=>finiteId(i.id)&&finiteId(i.quantity)&&Number.isSafeInteger(i.slot)&&i.slot>=0&&i.slot<28))
    throw Error('Invalid tick/inventory observation');
  return snapshot;
}
export function createNoCheatGathering({botName='HarnessTest',axeItemId,logItemId,treeObjectId,
  axeSource=null,requiredLogs=1}={}){
  if(!/^[A-Za-z0-9_ ]{1,12}$/.test(botName)||![axeItemId,logItemId,treeObjectId].every(finiteId)||
    !Number.isSafeInteger(requiredLogs)||requiredLogs<1||requiredLogs>27)
    throw Error('Explicit source-backed item/object IDs and bounded target required');
  let baseline=null,worldId=null,lastTick=-1;
  return Object.freeze({
    next(snapshot){
      const s=valid(snapshot,botName),p=s.player;
      if(!/^isolated-[A-Za-z0-9_-]{4,64}$/.test(s.world.instanceId??''))throw Error('Unknown isolated world identity');
      if(worldId&&worldId!==s.world.instanceId)throw Error('World identity changed');
      if(lastTick>s.tick)throw Error('Tick regressed');
      lastTick=s.tick;worldId=s.world.instanceId;
      const xp=p.xp?.Woodcutting;
      if(!Number.isSafeInteger(xp)||xp<0)throw Error('Actual Woodcutting XP observation required');
      if(baseline===null)baseline={xp,logs:countItem(p,logItemId)};
      const logs=countItem(p,logItemId),axe=countItem(p,axeItemId);
      if(axe===0){
        if(!axeSource||axeSource.type!=='ground_take'||axeSource.itemId!==axeItemId||
          !Number.isSafeInteger(axeSource.x)||!Number.isSafeInteger(axeSource.z))
          return {status:'blocked',stage:'acquire_axe',reason:'no_verified_normal_item_source'};
        const onGround=(s.nearbyGroundItems??[]).some(i=>
          i.itemId===axeItemId&&i.x===axeSource.x&&i.z===axeSource.z&&i.plane===p.plane);
        if(!onGround)return {status:'blocked',stage:'acquire_axe',reason:'item_not_observed_on_ground'};
        return {status:'planned',stage:'acquire_axe',action:{type:'ground_take',x:axeSource.x,z:axeSource.z,itemId:axeItemId},
          verify:'axe_added_to_inventory_from_world_action'};
      }
      if(logs<requiredLogs){
        const tree=(s.nearbyLocs??[]).find(o=>o.id===treeObjectId&&o.plane===p.plane&&
          Number.isSafeInteger(o.x)&&Number.isSafeInteger(o.z)&&
          Array.isArray(o.options)&&o.options.some(x=>/^chop(?: down)?$/i.test(x)));
        if(!tree)return {status:'blocked',stage:'chop_tree',reason:'no_verified_tree_in_observation'};
        return {status:'planned',stage:'chop_tree',action:{type:'loc_option',x:tree.x,z:tree.z,locId:treeObjectId,option:1},
          verify:'real_log_inventory_increase_plus_woodcutting_xp'};
      }
      if(xp<=baseline.xp)return {status:'blocked',stage:'verify_gathering',reason:'logs_seen_but_no_real_xp_gain'};
      // Banking is NOT implemented in PR #62's native action allowlist.
      return {status:'blocked',stage:'bank_logs',reason:'normal_bank_deposit_packet_and_ui_observation_not_implemented',
        observed:{gatheredLogs:logs-baseline.logs,woodcuttingXpIncrease:xp-baseline.xp}};
    }
  });
}
const QUEST_INGREDIENTS=Object.freeze(['bucket_milk','egg','pot_flour']);
export function inspectCooksAssistantEvidence({before,after,events=[]}={}){
  if(!before||!after||!Array.isArray(events))throw Error('Quest evidence inputs required');
  const accepted=events.filter(e=>e?.type==='native_item_acquired'&&e.observed===true&&
    QUEST_INGREDIENTS.includes(e.item)&&Number.isSafeInteger(e.tick));
  const items=new Set(accepted.map(e=>e.item));
  const questStarted=before.questStage===1;
  const questCompleted=after.questStage===2;
  const xpDelta=Number.isSafeInteger(after.cookingXp)&&Number.isSafeInteger(before.cookingXp)?
    after.cookingXp-before.cookingXp:null;
  const noCheatEvidence=events.every(e=>!['grant','invAdd','addXp','setVar','teleport','admin'].includes(e?.type));
  const observedHandIn=events.some(e=>e?.type==='npc_quest_hand_in'&&e.observed===true);
  const saved=events.some(e=>e?.type==='save_relog_verified'&&e.observed===true);
  const missing=QUEST_INGREDIENTS.filter(x=>!items.has(x));
  return {status:questStarted&&questCompleted&&xpDelta===3000&&noCheatEvidence&&
    observedHandIn&&saved&&missing.length===0?'evidence_ready_for_independent_runtime_review':'blocked',
    missing,questStarted,questCompleted,xpDelta,noCheatEvidence,observedHandIn,saved,
    note:'This evaluates supplied evidence only. It cannot prove a real quest without independent native logs and client verification.'};
}
