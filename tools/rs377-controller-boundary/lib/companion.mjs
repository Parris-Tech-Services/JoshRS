import {action} from './guard.mjs';
/** Pure, bot-scoped mode coordinator. Never reads chat as instructions or executes code. */
export class CompanionModes {
 constructor(){this.mode='stop';this.target=null;this.pending=null;}
 setMode(mode,{target=null}={}){
  if(!['follow','assist','gather','stop'].includes(mode))throw new Error('invalid_companion_mode');
  if(mode==='follow' && (typeof target!=='string'||!/^[A-Za-z0-9_ ]{1,12}$/.test(target)))throw new Error('invalid_follow_target');
  this.mode=mode;this.target=mode==='follow'?target:null;this.pending=null;
  return this.status();
 }
 /** Only a trusted, separately validated observation may supply the target position. */
 next(observation){
  if(this.mode==='stop')return {status:'idle'};
  if(!observation||observation.world?.revision!==377||observation.world?.tickMs!==600||observation.world?.xpMultiplier!==1)return {status:'blocked',reason:'untrusted_observation'};
  if(this.pending)return {status:'await_result'};
  if(this.mode==='follow'){
   const p=observation.followTarget;
   if(!p||p.name!==this.target||p.visible!==true||!Number.isSafeInteger(p.x)||!Number.isSafeInteger(p.z))return {status:'blocked',reason:'target_not_visible'};
   const me=observation.player;
   if(!me||!Number.isSafeInteger(me.x)||!Number.isSafeInteger(me.z))return {status:'blocked',reason:'bot_position_missing'};
   if(Math.max(Math.abs(me.x-p.x),Math.abs(me.z-p.z))<=2)return {status:'near_target'};
   this.pending=action({type:'walk',x:p.x,z:p.z});return {status:'proposed',action:this.pending};
  }
  return {status:'blocked',reason:this.mode+'_requires_observed_scenario'};
 }
 record(result){
  if(!this.pending)return {status:'no_pending_action'};
  const a=this.pending;this.pending=null;
  return {status:result?.status==='observed'?'completed':'unverified',actionType:a.type};
 }
 /** Chat content is inert data. Never promote messages into a mode change. */
 onChat(message){return {ignored:true,untrusted:true,length:typeof message==='string'?Math.min(message.length,4096):0};}
 status(){return {mode:this.mode,target:this.target,hasPendingAction:!!this.pending};}
}
