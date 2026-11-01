// This declaration describes the real exported JavaScript runtime, while the
// contract probe imports the actual immutable upstream RS-SDK types.
import type {BotAction, BotWorldState} from '../contracts/vendor/sdk/types.js';
export interface Observation {
  player: {username: string};
  world: {instanceId: string};
  tick: number;
}
export interface TransportSession {
  status(): {authenticated: boolean};
  sendPacket(packet: {opcode:number; body:Uint8Array; variable:boolean}):
    {status:'queued_unverified'|'dispatched_unverified'};
}
export interface NativeObserver {observe():Promise<Observation>}
export interface Sdk377Runtime {
  observe():Promise<Observation>;
  getSdkState():Promise<{state:BotWorldState;source:object}>;
  action(action:BotAction):Promise<{status:string;tick:number;opcode?:number;world?:string;verifiedEffect?:false}>;
  lastObservedTick():number|null;
}
export function createSdk377Runtime(args:{
 session:TransportSession; observer:NativeObserver;
 botName:string; expectedWorld:string
}):Sdk377Runtime;
