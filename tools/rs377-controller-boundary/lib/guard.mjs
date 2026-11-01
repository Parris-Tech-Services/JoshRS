/** Source-only contract; never interpret this as live world authentication. */
export const TYPES = Object.freeze(['walk','npc_option','loc_option','ground_take','inventory_option','item_on_loc','dialog_option','wait']);
const KEYS = {
  walk:['x','z'],npc_option:['npcIndex','option'],loc_option:['x','z','locId','option'],
  ground_take:['x','z','itemId'],inventory_option:['slot','option'],
  item_on_loc:['slot','x','z','locId'],dialog_option:['option'],wait:['ticks']
};
export const integer = (value, maximum=0x7fffffff) => Number.isSafeInteger(value) && value >= 0 && value <= maximum;
export function action(raw) {
  if (!raw || typeof raw!=='object' || Array.isArray(raw) || !Object.hasOwn(KEYS,raw.type)) throw new Error('forbidden_action');
  const keys=KEYS[raw.type];
  if (Object.keys(raw).some(k=>k!=='type' && !keys.includes(k))) throw new Error('unexpected_action_field');
  for(const key of keys) if (!integer(raw[key],key==='ticks'?20:0x7fffffff)) throw new Error('invalid_action_field');
  if (['walk','loc_option','ground_take','item_on_loc'].includes(raw.type) && (raw.x>16383 || raw.z>16383)) throw new Error('invalid_coordinates');
  if (Object.hasOwn(raw,'option') && (raw.option<1 || raw.option>5)) throw new Error('invalid_option');
  if (Object.hasOwn(raw,'slot') && raw.slot>27) throw new Error('invalid_slot');
  if (raw.type==='wait' && raw.ticks===0) throw new Error('invalid_ticks');
  return Object.freeze({...raw});
}
export function snapshot(raw, botName, worldId) {
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('missing_state');
  const w=raw.world,p=raw.player;
  if(!w || w.mode!=='isolated' || w.revision!==377 || w.tickMs!==600 || w.xpMultiplier!==1 || w.instanceId!==worldId || !/^isolated-[a-z0-9_-]{4,64}$/i.test(worldId)) throw new Error('untrusted_world');
  if(!p || p.username!==botName || !p.isBot || !integer(raw.tick) || !integer(p.x,16383) || !integer(p.z,16383) || !integer(p.plane,3)) throw new Error('untrusted_bot');
  if(!Number.isSafeInteger(raw.observedAtMs) || raw.observedAtMs>Date.now()+1000 || Date.now()-raw.observedAtMs>3000) throw new Error('stale_observation');
  if(!Array.isArray(p.inventory) || p.inventory.length>28 || !p.inventory.every(i=>i && integer(i.id) && integer(i.slot,27) && integer(i.quantity))) throw new Error('invalid_inventory');
  if(!p.xp || typeof p.xp!=='object' || Object.keys(p.xp).length>25 || Object.values(p.xp).some(x=>!integer(x))) throw new Error('invalid_xp');
  if(!p.questStages || typeof p.questStages!=='object' || Object.keys(p.questStages).length>256) throw new Error('invalid_quest_state');
  // ALLOWLIST OUTPUT: do not leak anything a future observer accidentally attaches
  // (other players, account DB, environment variables, chat history, credentials).
  const safe={observedAtMs:raw.observedAtMs,tick:raw.tick,world:{mode:w.mode,revision:w.revision,tickMs:w.tickMs,xpMultiplier:w.xpMultiplier,instanceId:w.instanceId},
    player:{username:p.username,isBot:true,x:p.x,z:p.z,plane:p.plane,inventory:p.inventory.map(i=>({slot:i.slot,id:i.id,quantity:i.quantity})),xp:structuredClone(p.xp),questStages:structuredClone(p.questStages),dialogue:p.dialogue??null}};
  if(Buffer.byteLength(JSON.stringify(safe))>32768)throw new Error('oversize_observation');
  return safe;
}
export function sameIdentity(before,after){
  if(after.world.instanceId!==before.world.instanceId || after.player.username!==before.player.username || after.tick<before.tick) throw new Error('world_or_bot_changed');
}
