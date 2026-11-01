/**
 * Contract probes are intentionally checked by TypeScript against the exact
 * pinned upstream sdk/types.ts, NOT against locally invented declarations.
 * The runtime is JS, hence this declares its public boundary explicitly.
 */
import type {BotAction, BotWorldState, ActionResult} from './vendor/sdk/types';
import {createSdk377Runtime} from '../src/sdk-runtime.mjs';

type Observer = {observe(): Promise<unknown>};
type NativeSession = {
  status(): {authenticated: boolean};
  sendPacket(packet: {opcode: number; body: Buffer; variable: boolean}):
    {status: 'queued_unverified' | 'dispatched_unverified'};
};
type Runtime = {
  observe(): Promise<unknown>;
  getSdkState(): Promise<{state: BotWorldState}>;
  action(action: BotAction): Promise<{
    status: string; verifiedEffect?: false; opcode?: number; tick: number
  }>;
};
const runtime: Runtime = createSdk377Runtime({
  session: {} as NativeSession,
  observer: {} as Observer,
  botName:'HarnessBot',
  expectedWorld:'isolated-type-contract'
});
const action: BotAction = {type:'walkTo',x:3201,z:3202,reason:'typed test'};
const result: Promise<{status:string;verifiedEffect?:false;opcode?:number;tick:number}> = runtime.action(action);
const state: Promise<{state:BotWorldState}> = runtime.getSdkState();
const sdkResult: ActionResult = {success:false,message:'Dispatch not observed',phase:'dispatch'};
void [result,state,sdkResult];
