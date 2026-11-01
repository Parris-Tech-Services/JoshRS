/**
 * Hard runtime and action gate for an RS-SDK-style JoshRS 377 harness.
 *
 * This is not an anti-cheat proof in the game engine. The native #377 adapter
 * must independently reject mutations and run ordinary game mechanics.
 */
export const ACTION_TYPES = Object.freeze([
  'walk', 'npc_option', 'loc_option', 'ground_take',
  'inventory_option', 'item_on_loc', 'dialog_option', 'wait'
]);
const allowed = new Set(ACTION_TYPES);
const forbidden = /(?:invadd|addxp|setvar|setlevel|teleport|giveitem|admin|cheat|spawn|grant|writefile|exec|eval)/i;
const integer = (n, max = 0x7fffffff) => Number.isSafeInteger(n) && n >= 0 && n <= max;
function integerField(a, field, max) {
  if (!integer(a[field], max)) throw new Error(`Invalid ${field}`);
}
export function validateAction(action) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) throw new Error('Action must be an object');
  if (typeof action.type !== 'string' || !allowed.has(action.type) || forbidden.test(action.type)) throw new Error('Unsupported or privileged action');
  const fields = {
    walk: ['x','z'], npc_option: ['npcIndex','option'], loc_option: ['x','z','locId','option'],
    ground_take: ['x','z','itemId'], inventory_option: ['slot','option'],
    item_on_loc: ['slot','x','z','locId'], dialog_option: ['option'], wait: ['ticks']
  }[action.type];
  const extras = Object.keys(action).filter(k=>k!=='type'&&!fields.includes(k));
  if (extras.length) throw new Error('Unexpected action fields: '+extras.join(','));
  for (const field of fields) integerField(action,field,field==='ticks'?20:0x7fffffff);
  if ((action.type==='npc_option'||action.type==='loc_option'||action.type==='inventory_option') && action.option>5) throw new Error('Option out of range');
  if (action.type==='walk' && (action.x>16383 || action.z>16383)) throw new Error('World coordinate out of range');
  if (action.type==='wait' && action.ticks<1) throw new Error('Wait must be at least one tick');
  return Object.freeze({...action});
}
export function validateSnapshot(snapshot, allowedBots) {
  if (!snapshot || typeof snapshot!=='object' || !snapshot.world || !snapshot.player) throw new Error('No world/player snapshot');
  const w = snapshot.world,p=snapshot.player;
  if (w.mode!=='isolated' || w.revision!==377 || w.tickMs!==600 || w.xpMultiplier!==1) throw new Error('Not a normal-speed isolated revision-377 world');
  if (typeof w.instanceId!=='string'||!/^isolated-[a-z0-9_-]{4,64}$/i.test(w.instanceId)) throw new Error('Missing isolated-world identifier');
  if (!p.isBot || typeof p.username!=='string' || !allowedBots.includes(p.username)) throw new Error('Unapproved bot account');
  if (!integer(snapshot.tick)||!integer(p.x)||!integer(p.z)||!integer(p.plane,3)) throw new Error('Invalid tick/player position');
  if (p.x>16383||p.z>16383) throw new Error('Invalid player coordinates');
  if (!Array.isArray(p.inventory)||!p.inventory.every(i=>integer(i.id)&&integer(i.quantity)&&integer(i.slot,27))) throw new Error('Invalid inventory');
  if (!p.xp || typeof p.xp!=='object' || Object.values(p.xp).some(v=>!integer(v))) throw new Error('Invalid XP snapshot');
  if (!p.questStages || typeof p.questStages!=='object') throw new Error('Invalid quest-state snapshot');
  return snapshot;
}
