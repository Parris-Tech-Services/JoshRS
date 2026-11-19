/**
 * Compile the real immutable upstream SDK's TypeScript declarations with
 * the actual JoshRS JS exports. Never substitute a locally invented BotAction
 * or BotWorldState. This verifies assignability, not live runtime provenance.
 */
import type {BotAction,BotWorldState,ActionResult} from './.pinned/sdk/types.js';
import {mapSdkAction,toBotWorldState} from './src/sdk-bridge.mjs';
import {createSdk377Dispatcher} from './src/sdk-dispatcher.mjs';

const walk:BotAction={type:'walkTo',x:3201,z:3201,reason:'typed reference'};
const npc:BotAction={type:'interactNpc',npcIndex:4,optionIndex:1,reason:'typed reference'};
const loc:BotAction={type:'interactLoc',x:3201,z:3201,locId:10,optionIndex:1,reason:'typed reference'};
void npc;void loc;

// Compile against the true upstream union, including its 1-based optionIndex.
export function checkedAction(action:BotAction,snapshot:Parameters<typeof mapSdkAction>[1]) {
  return mapSdkAction(action,snapshot);
}
checkedAction(walk,{} as Parameters<typeof mapSdkAction>[1]);

// The *actual* state produced by toBotWorldState must be assignable to
// upstream BotWorldState, not an independently hand-written substitute.
export function checkedState(raw:Parameters<typeof toBotWorldState>[0]):BotWorldState {
  const actual=toBotWorldState(raw,{botName:'HarnessBot',expectedWorld:'isolated-test'});
  const state:BotWorldState=actual.state;
  return state;
}
type Dispatcher=ReturnType<typeof createSdk377Dispatcher>;
type DispatchOutput=Awaited<ReturnType<Dispatcher['sendSdkAction']>>;
export function checkedResult(actual:DispatchOutput):ActionResult {
  return actual;
}

// @ts-expect-error: unsafe privileged action must never enter BotAction
const cheat:BotAction={type:'grantXp',amount:999999,reason:'invalid'};
void cheat;
