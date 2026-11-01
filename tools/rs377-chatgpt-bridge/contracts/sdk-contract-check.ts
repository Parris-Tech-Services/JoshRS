/**
 * Typecheck against immutable MaxBittker/rs-sdk sdk/types.ts.
 * This file lives alongside a vendored byte-for-byte upstream type definition
 * fetched by CI; never use a hand-written stand-in for BotAction/WorldState.
 */
import type {BotAction, BotWorldState, ActionResult} from './vendor/sdk/types.js';
import {createSdk377Runtime} from '../src/sdk-runtime.mjs';

const runtime=createSdk377Runtime({
  session: {} as any,
  observer: {} as any,
  botName:'HarnessBot',
  expectedWorld:'isolated-type-contract'
});
const action: BotAction = {type:'walkTo',x:3201,z:3202,reason:'typed test'};
const result = runtime.action(action);
const state: Promise<{state:BotWorldState;source:object}> = runtime.getSdkState();
const checkState=(s:BotWorldState):number=>s.tick;
const checkResult=(r:ActionResult):boolean=>r.success;
void [result,state,checkState,checkResult];
