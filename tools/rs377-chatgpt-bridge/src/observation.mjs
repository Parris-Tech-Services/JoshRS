/**
 * Narrow, read-only, single-disposable-account view of revision-377 state.
 * A native engine/client observer must provide real snapshots; NOTHING here
 * reads/mutates GameWorld, other players, saves or simulated inventory/XP.
 */
export const SKILLS377=Object.freeze([
  'Attack','Defence','Strength','Hitpoints','Ranged','Prayer','Magic',
  'Cooking','Woodcutting','Fletching','Fishing','Firemaking','Crafting',
  'Smithing','Mining','Herblore','Agility','Thieving','Slayer','Farming','Runecraft'
]);
const isInt=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const fail=s=>{throw new Error('Invalid read-only bot observation: '+s)};
const copy=x=>structuredClone(x);
function deepFreeze(o) {
  if(o&&typeof o==='object'&&!Object.isFrozen(o)) {
    Object.values(o).forEach(deepFreeze);Object.freeze(o);
  }
  return o;
}
const assertArray=(value,name)=>{if(value!==null&&!Array.isArray(value))fail(name+' must be an observed array or null')};
const checkTile=(p)=>p&&isInt(p.x,16383)&&isInt(p.z,16383)&&isInt(p.plane,3);
const checkItems=(items,name,maxSlot)=>{
  assertArray(items,name);if(items===null)return;
  if(!items.every(i=>i&&isInt(i.slot,maxSlot)&&isInt(i.id,65535)&&isInt(i.count,0x7fffffff)))
    fail(name+' slot/id/count');
  if(new Set(items.map(i=>i.slot)).size!==items.length)fail(name+' duplicate slots');
};
const checkNearby=(a,name,idField)=>{
  assertArray(a,name);
  if(a===null)return;
  if(!a.every(e=>e&&isInt(e[idField],65535)&&isInt(e.x,16383)&&isInt(e.z,16383)))
    fail(name+' invalid position/identity');
};
export function validateObservation(raw,{botName,expectedWorld}={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('missing raw input');
  const own=['world','player','tick','position','skills','inventory','equipment',
    'nearbyNpcs','nearbyLocs','groundItems','dialogue','questStages','sdkDetails'];
  if(Object.keys(raw).some(k=>!own.includes(k)))fail('unexpected top-level observation fields');
  if(!raw.world||Object.keys(raw.world).some(k=>!['mode','revision','tickMs','xpMultiplier','instanceId','sourceSha'].includes(k)))
    fail('unexpected world fields');
  if(!raw.player||Object.keys(raw.player).some(k=>!['username','isBot'].includes(k)))
    fail('unexpected player private fields');
  const v=copy(raw);const w=v.world||{}, p=v.player||{};
  if(!botName||!/^Harness[A-Za-z0-9_-]{1,10}$/.test(botName))fail('approved bot name required');
  if(p.username!==botName||p.isBot!==true)fail('wrong identity');
  if(w.mode!=='isolated'||w.revision!==377||w.tickMs!==600||w.xpMultiplier!==1)
    fail('only isolated normal speed/XP world is allowed');
  if(typeof w.instanceId!=='string'||!/^isolated-[a-z0-9_-]{4,64}$/i.test(w.instanceId))
    fail('missing isolated-world fingerprint');
  if(expectedWorld&&expectedWorld!==w.instanceId)fail('wrong world instance');
  if(typeof w.sourceSha!=='string'||!/^[a-f0-9]{40}$/i.test(w.sourceSha))fail('unverified world source SHA');
  if(!isInt(v.tick))fail('tick');
  if(v.position!==null&&!checkTile(v.position))fail('position');
  if(!Object.hasOwn(v,'position'))fail('missing position field');
  if(v.skills!==null) {
    assertArray(v.skills,'skills');
    if(v.skills.length!==21||new Set(v.skills.map(s=>s.name)).size!==21||
       !SKILLS377.every(name=>v.skills.some(s=>s.name===name)))fail('full 21 skills required when known');
    if(!v.skills.every(s=>isInt(s.xpTenths,2_000_000_000)&&isInt(s.level,99)&&isInt(s.baseLevel,99)))
      fail('invalid level/XP');
  }
  for(const k of ['skills','inventory','equipment','nearbyNpcs','nearbyLocs','groundItems','dialogue','questStages','sdkDetails']) {
    if(!Object.hasOwn(v,k))fail('missing explicit '+k+' (null if unknown)');
  }
  checkItems(v.inventory,'inventory',27);checkItems(v.equipment,'equipment',27);
  checkNearby(v.nearbyNpcs,'nearbyNpcs','index');
  checkNearby(v.nearbyLocs,'nearbyLocs','id');
  checkNearby(v.groundItems,'groundItems','id');
  if(v.dialogue!==null&&(!v.dialogue||typeof v.dialogue!=='object'||typeof v.dialogue.isOpen!=='boolean'||!Array.isArray(v.dialogue.options)))
    fail('dialogue');
  if(v.questStages!==null&&(!v.questStages||typeof v.questStages!=='object'||Array.isArray(v.questStages)))
    fail('questStages');
  if(v.sdkDetails!==null&&(!v.sdkDetails||typeof v.sdkDetails!=='object'||Array.isArray(v.sdkDetails)))
    fail('sdkDetails');
  const supported=['position','skills','inventory','equipment','nearbyNpcs','nearbyLocs',
    'groundItems','dialogue','questStages','sdkDetails'];
  v.unsupported=supported.filter(key=>v[key]===null);
  return deepFreeze(v);
}
export function createObserver(readRaw,{botName,expectedWorld}={}) {
  if(typeof readRaw!=='function')throw new TypeError('Read-only source callback required');
  let lastTick=-1,lastWorld=null;
  return Object.freeze({
    async observe(){
      const snapshot=validateObservation(await readRaw(),{botName,expectedWorld});
      if(lastWorld!==null&&snapshot.world.instanceId!==lastWorld)
        throw new Error('World changed during observation');
      if(snapshot.tick<lastTick)throw new Error('Observed tick decreased');
      lastWorld=snapshot.world.instanceId;lastTick=snapshot.tick;
      return snapshot;
    }
  });
}
