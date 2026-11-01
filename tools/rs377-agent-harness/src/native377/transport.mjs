/**
 * Actual native TCP transport adapter for the isolated Action377 harness.
 *
 * Agy needs to provide a REAL read-only 377 observer. No observer -> hard error,
 * never invented in-game coordinates, inventory or quest state.
 * Walking is wired to the native RuneScape client; all unsupported operations
 * explicitly report unavailable (not false success).
 */
import {validateAction} from '../guard.mjs';
export function createNative377Transport({client,observeWorld}={}){
  if(!client||typeof client.walkTo!=='function'||typeof client.status!=='function')
    throw new Error('A real native-377 client instance is required');
  if(client.target?.world!=='isolated')throw new Error('Native harness only supports isolated-world testing');
  if(typeof observeWorld!=='function')throw new Error('Real 377 world observer required; never synthesize state');
  return Object.freeze({
    async observe(){
      const state=await observeWorld();
      if(!state||typeof state!=='object'||!state.player||!state.world)
        throw new Error('Observer did not return real world/player state');
      return state;
    },
    async dispatch(raw){
      const action=validateAction(raw);
      if(client.status().connected!==true) return {accepted:false,reason:'bot_offline'};
      if(action.type==='walk'){
        const result=client.walkTo(action.x,action.z);
        return {accepted:result?.status==='dispatched_unverified',reason:result?.status??'not_dispatched'};
      }
      // No NPC/item/chat packet is implemented in Client377 yet.
      return {accepted:false,reason:'native_377_action_not_implemented'};
    }
  });
}
