import {randomBytes,timingSafeEqual} from 'node:crypto';
import {action,snapshot} from './guard.mjs';
import {performObserved} from './outcomes.mjs';
import {ReplayLedger} from './recovery.mjs';
import {DeterministicGoalExecutor} from './executor.mjs';
const goodToken=(token,expected)=>{
  if(typeof token!=='string'||typeof expected!=='string')return false;
  const a=Buffer.from(token),b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
};
/** All access is explicitly bot-scoped; does not connect to a real RuneScape world. */
export class BoundaryController{
  constructor({transport,botName='HarnessTest',worldId='isolated-377-harness',ledger,leaseMs=60000,minimumTickSpacing=1,maxActionsPerMinute=12}={}){
    if(!transport||typeof transport.observe!=='function'||typeof transport.dispatch!=='function')throw new Error('missing_trusted_transport');
    if(!(ledger instanceof ReplayLedger))throw new Error('durable_replay_ledger_required');
    if(!/^([A-Za-z][A-Za-z0-9_]{2,19})$/.test(botName)||!/^isolated-[a-z0-9_-]{4,64}$/i.test(worldId))throw new Error('invalid_bot_scope');
    if(!Number.isInteger(leaseMs)||leaseMs<1000||leaseMs>300000||!Number.isInteger(maxActionsPerMinute)||maxActionsPerMinute<1||maxActionsPerMinute>60||!Number.isInteger(minimumTickSpacing)||minimumTickSpacing<1)throw new Error('invalid_limits');
    this.transport=transport;this.botName=botName;this.worldId=worldId;this.ledger=ledger;this.leaseMs=leaseMs;this.maximum=maxActionsPerMinute;this.spacing=minimumTickSpacing;
    this.holder=null;this.expiry=0;this.active=null;this.claiming=false;this.history=[];this.lastActionTick=-1;this.goals=new DeterministicGoalExecutor();
  }
  async observe(){return snapshot(await this.transport.observe(),this.botName,this.worldId);}
  async claim(){
    if(this.claiming || this.active || (this.holder && Date.now()<this.expiry))throw new Error('controller_busy');
    this.claiming=true;
    try{
      if(this.holder){this.ledger.closeSession(this.holder);this.holder=null;}
      const state=await this.observe();
      const secret=randomBytes(32).toString('base64url');this.ledger.openSession(secret);this.holder=secret;this.expiry=Date.now()+this.leaseMs;
      return {lease:secret,expiresAt:this.expiry,botName:this.botName,worldId:state.world.instanceId};
    }finally{this.claiming=false;}
  }
  requireLease(secret){
    if(!this.holder||!goodToken(secret,this.holder)||Date.now()>=this.expiry)throw new Error('lease_required');
  }
  renew(secret){this.requireLease(secret);this.expiry=Date.now()+this.leaseMs;return {expiresAt:this.expiry};}
  async run(secret,id,raw,{timeoutMs=1200}={}){
    this.requireLease(secret);
    if(this.active)throw new Error('action_in_flight');
    const act=action(raw);
    // Lock before the first asynchronous observation/reservation: concurrent HTTP calls
    // must never both pass the idle check and dispatch into one bot session.
    const abort=new AbortController();this.active=abort;
    try {
    const now=Date.now();this.history=this.history.filter(t=>now-t<60000);
    if(this.history.length>=this.maximum)throw new Error('rate_limited');
    const state=await this.observe();
    if(this.lastActionTick>=0&&state.tick<this.lastActionTick+this.spacing)throw new Error('tick_rate_limited');
    // Reserve BEFORE dispatch and persist across crashes. Same ID is never replayed.
    await this.ledger.reserve(id,act);
    this.history.push(now);this.lastActionTick=state.tick;
    try{
      const result=await performObserved(this.transport,act,{botName:this.botName,worldId:this.worldId,timeoutMs,signal:abort.signal,onDispatch:()=>{}});
      await this.ledger.finish(id,result.status);
      return {actionId:id,...result};
    }catch(e){
      await this.ledger.finish(id,'unverified');throw e;
    }
    } finally {if(this.active===abort)this.active=null;}
  }
  stop(secret){
    this.requireLease(secret);
    this.active?.abort();this.goals.stop();
    this.ledger.closeSession(this.holder);this.holder=null;this.expiry=0;
    return {stopped:true,activeActionCancelled:true};
  }
  proposeGoal(secret,goal,tick){this.requireLease(secret);return this.goals.propose(goal,tick);}
  async nextGoalStep(secret,tick,id){
    this.requireLease(secret);
    const next=this.goals.next(tick);if(!next)return {status:'no_step',goal:this.goals.summary()};
    try{const result=await this.run(secret,id,next.action);this.goals.record(result);return {...result,goal:this.goals.summary()};}
    catch(e){this.goals.record({status:'rejected'});throw e;}
  }
  status(){return {botName:this.botName,worldId:this.worldId,leaseOccupied:!!this.holder&&Date.now()<this.expiry,actionInFlight:!!this.active,goal:this.goals.summary(),recentActionCount:this.history.filter(t=>Date.now()-t<60000).length};}
}
/** Provider-independent declarations; no arbitrary code or shell tools. */
export const TOOL_SCHEMAS=Object.freeze([
  {name:'observe',required:[],fields:[]},
  {name:'walk',required:['x','z'],fields:['x','z']},
  {name:'npc_option',required:['npcIndex','option'],fields:['npcIndex','option']},
  {name:'loc_option',required:['x','z','locId','option'],fields:['x','z','locId','option']},
  {name:'ground_take',required:['x','z','itemId'],fields:['x','z','itemId']},
  {name:'inventory_option',required:['slot','option'],fields:['slot','option']},
  {name:'item_on_loc',required:['slot','x','z','locId'],fields:['slot','x','z','locId']},
  {name:'dialog_option',required:['option'],fields:['option']},
  {name:'wait',required:['ticks'],fields:['ticks']},
  {name:'stop',required:[],fields:[]},
  {name:'report',required:['actionId'],fields:['actionId']}
]);
// Standard JSON Schema declarations suitable for tools/function-calling adapters.
// No dynamic code generation, file tools, shell access, admin or game-state grants.
export const MODEL_TOOL_DECLARATIONS=Object.freeze(TOOL_SCHEMAS.map(def=>Object.freeze({
  name:def.name, description:({observe:'Read bot-only state',stop:'Cancel and release this bot controller',report:'Get one saved action result'}[def.name]||'Issue one normal revision-377 gameplay action'),
  parameters:{type:'object',additionalProperties:false,required:def.required,properties:Object.fromEntries(def.fields.map(f=>[f,{type:f==='actionId'?'string':'integer',...(f==='actionId'?{minLength:6,maxLength:80}:{minimum:f==='option'||f==='ticks'?1:0,maximum:f==='ticks'?20:f==='option'?5:f==='slot'?27:16383})}]))}
})));
export function resolveTool(name,args){
  if(name==='observe'||name==='stop'||name==='report')throw new Error('control_tool_not_action');
  const def=TOOL_SCHEMAS.find(x=>x.name===name);
  if(!def||!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).some(k=>!def.fields.includes(k)))throw new Error('unsupported_tool');
  return action({type:name,...args});
}
