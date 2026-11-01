import {action} from './guard.mjs';
/** LLM/provider output may propose ONLY a bounded list of normal gameplay inputs. */
export class DeterministicGoalExecutor{
  constructor({minimumPlanTicks=10,maxSteps=12}={}){
    if(!Number.isInteger(minimumPlanTicks)||minimumPlanTicks<2||!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>20)throw new Error('invalid_goal_limits');
    this.minimumPlanTicks=minimumPlanTicks;this.maxSteps=maxSteps;this.lastPlanTick=-Infinity;this.lastActionTick=-1;this.steps=[];this.state='idle';this.index=0;
  }
  propose(goal,tick){
    if(!Number.isSafeInteger(tick)||tick<0||tick-this.lastPlanTick<this.minimumPlanTicks)return {accepted:false,reason:'planning_cooldown'};
    if(this.state==='running')return {accepted:false,reason:'goal_in_progress'};
    if(!goal||typeof goal!=='object'||Array.isArray(goal)||Object.keys(goal).some(k=>!['steps'].includes(k))||!Array.isArray(goal.steps)||goal.steps.length===0||goal.steps.length>this.maxSteps)return {accepted:false,reason:'invalid_goal'};
    let steps;
    try{steps=goal.steps.map(action);}catch{return {accepted:false,reason:'forbidden_step'};}
    this.steps=steps;this.index=0;this.state='running';this.lastPlanTick=tick;
    return {accepted:true,stepCount:steps.length};
  }
  next(tick){
    if(this.state!=='running')return null;
    if(!Number.isSafeInteger(tick)||tick<=this.lastActionTick)return null;
    if(this.index>=this.steps.length){this.state='completed';return null;}
    this.lastActionTick=tick;
    return {index:this.index,action:this.steps[this.index]};
  }
  record(result){
    if(this.state!=='running')return this.state;
    if(result?.status!=='observed'){this.state='blocked';return this.state;}
    this.index++;
    if(this.index>=this.steps.length)this.state='completed';
    return this.state;
  }
  stop(){this.steps=[];this.state='stopped';}
  summary(){return {state:this.state,completedSteps:this.index,totalSteps:this.steps.length,lastActionTick:this.lastActionTick,lastPlanTick:Number.isFinite(this.lastPlanTick)?this.lastPlanTick:null};}
}
