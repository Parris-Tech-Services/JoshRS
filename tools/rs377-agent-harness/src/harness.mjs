import { validateAction,validateSnapshot } from './guard.mjs';
function observationFingerprint(s) {
  const p=s.player;
  return JSON.stringify({
    x:p.x,z:p.z,plane:p.plane,inventory:p.inventory,
    xp:p.xp,quests:p.questStages,dialogue:p.dialogue??null,
    target:p.target??null,animation:p.animation??null
  });
}
function evidence(before,after) {
  const b=before.player,a=after.player;
  const changes=[];
  if(b.x!==a.x||b.z!==a.z||b.plane!==a.plane)changes.push('position');
  if(JSON.stringify(b.inventory)!==JSON.stringify(a.inventory))changes.push('inventory');
  if(JSON.stringify(b.xp)!==JSON.stringify(a.xp))changes.push('xp');
  if(JSON.stringify(b.questStages)!==JSON.stringify(a.questStages))changes.push('quest');
  if(JSON.stringify(b.dialogue??null)!==JSON.stringify(a.dialogue??null))changes.push('dialogue');
  if(JSON.stringify(b.target??null)!==JSON.stringify(a.target??null))changes.push('target');
  if(JSON.stringify(b.animation??null)!==JSON.stringify(a.animation??null))changes.push('animation');
  return changes;
}
/**
 * Transport interface supplied by Agy: observe(): Promise<Snapshot>,
 * dispatch(action): Promise<{accepted:boolean}>. The real adapter must
 * authenticate a disposable bot session and use legitimate game inputs.
 */
export function createHarness(transport,{allowedBots=['HarnessTest'],enableIsolatedActions=false}={}) {
  if(!transport||typeof transport.observe!=='function'||typeof transport.dispatch!=='function')throw new Error('Invalid transport');
  let busy=false;
  return {
    async observe(){
      return validateSnapshot(await transport.observe(),allowedBots);
    },
    async perform(raw){
      if(busy)throw new Error('Concurrent actions forbidden');
      busy=true;
      try {
        const action=validateAction(raw);
        const before=validateSnapshot(await transport.observe(),allowedBots);
        if(!enableIsolatedActions)return {status:'dry_run',action,evidence:[],beforeTick:before.tick};
        const ack=await transport.dispatch(action);
        if(!ack||ack.accepted!==true)return {status:'rejected',action,evidence:[],beforeTick:before.tick};
        const after=validateSnapshot(await transport.observe(),allowedBots);
        if(after.world.instanceId!==before.world.instanceId||after.player.username!==before.player.username)
          throw new Error('World or player identity changed during action');
        if(after.tick<before.tick)throw new Error('World tick went backwards');
        const changes=evidence(before,after);
        return {
          status:changes.length?'observed_effect':'unverified_dispatch',
          action,evidence:changes,beforeTick:before.tick,afterTick:after.tick,
          note:changes.length?'State changed, not proof the high-level objective completed':'Packet dispatch alone is not successful gameplay'
        };
      } finally {busy=false;}
    }
  };
}
