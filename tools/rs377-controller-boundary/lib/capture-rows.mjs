import {actors,actionKinds,actionResults,choices,date,hash,id,outcomes,reject,shape,status} from './capture-schema.mjs';
export function checkRows(x,start,end){
 if(!Array.isArray(x.observedActions)||x.observedActions.length>100)reject('invalid_actions');
 let previous=start;
 for(const a of x.observedActions){
  shape(a,['at','actor','action','tick','result'],'action');
  const t=date(a.at);
  if(t<previous||t>end)reject('out_of_order_action');
  previous=t;
  if(!actors.has(a.actor)||!actionKinds.has(a.action)||!actionResults.has(a.result))reject('invalid_action');
  if(a.tick!==null&&(!Number.isSafeInteger(a.tick)||a.tick<0))reject('invalid_tick');
  if(a.result==='observed'&&a.tick===null&&a.action!=='run_tests')reject('observed_without_tick');
 }
 shape(x.rawTestOutcome,['runner','result','exitCode','stdoutSha256','stderrSha256'],'raw_test_outcome');
 id(x.rawTestOutcome.runner,'runner');
 status(x.rawTestOutcome.result);
 const exit=x.rawTestOutcome.exitCode;
 if(exit!==null&&(!Number.isInteger(exit)||exit<0||exit>255))reject('invalid_exit_code');
 for(const k of ['stdoutSha256','stderrSha256']){
  if(x.rawTestOutcome[k]!==null)hash(x.rawTestOutcome[k],64,k);
 }
 if(x.rawTestOutcome.result==='pass'&&exit!==null&&exit!==0)reject('exit_status_mismatch');
 if(x.rawTestOutcome.result==='fail'&&exit===0)reject('exit_status_mismatch');
 if(!Array.isArray(x.assertions)||!x.assertions.length||x.assertions.length>50)reject('invalid_assertions');
 const names=new Set();
 for(const a of x.assertions){
  shape(a,['name','outcome','failureCode'],'assertion');
  id(a.name,'assertion_name');
  status(a.outcome);
  if(names.has(a.name))reject('duplicate_assertion');
  names.add(a.name);
  if(a.outcome==='pass'&&a.failureCode!==null)reject('pass_has_failure');
  if(a.outcome!=='pass')id(a.failureCode,'failure_code');
 }
 const passed=x.rawTestOutcome.result==='pass';
 if(passed!==x.assertions.every(a=>a.outcome==='pass'))reject('outcome_assertions_mismatch');
 if(passed&&x.world.mode==='unknown'&&x.kind!=='source')reject('unknown_world_pass');
 if(passed&&choices('disposable377 same_world gameplay').has(x.kind)){
  if(!x.observedActions.some(a=>a.result==='observed'&&a.tick!==null))reject('no_observed_action');
  if(!choices('disposable family').has(x.identities.bot))reject('unknown_bot');
  if(x.kind==='disposable377'&&(x.world.mode!=='isolated'||x.identities.bot!=='disposable'))reject('not_disposable');
 }
 const required=x.kind==='same_world'?['two_clients_visible','world_identity_matched']:
  x.kind==='gameplay'?['normal_action','observed_effect','persistent_relogin']:[];
 if(passed&&required.some(n=>!x.assertions.some(a=>a.name===n&&a.outcome==='pass')))reject('required_assertions_missing');
 return passed;
}
