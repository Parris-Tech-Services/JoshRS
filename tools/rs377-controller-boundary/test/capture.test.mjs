import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseEvidenceCapture} from '../lib/capture.mjs';
const template=JSON.parse(readFileSync(new URL('../fixtures/evidence-capture.template.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(template);
const parse=o=>parseEvidenceCapture(JSON.stringify(o));
function success(){
 const a=clone();
 a.observedActions=[{at:'2026-11-02T00:00:00Z',actor:'bot',action:'walk',tick:5,result:'observed'}];
 a.rawTestOutcome={runner:'node_test',result:'pass',exitCode:0,stdoutSha256:'a'.repeat(64),stderrSha256:'b'.repeat(64)};
 a.assertions=['normal_action','observed_effect','persistent_relogin'].map(name=>({name,outcome:'pass',failureCode:null}));
 return a;
}
test('template stays blocked, preserves failure, never marks live',()=>{
 const v=parse(clone());
 assert.equal(v.captureStatus,'blocked');
 assert.equal(v.host.sourceSha256.length,64);
 assert.equal(v.assertions[0].failureCode,'no_real_session');
 assert.equal(v.liveVerified,false);
});
test('passing fixture is not live proof',()=>{
 const v=parse(success());
 assert.equal(v.captureStatus,'fixture_assertions_passed_not_live');
 assert.equal(v.liveVerified,false);
});
test('operator capture still requires independent review',()=>{
 const a=success();a.evidenceOrigin='operator-capture';
 a.host.identityHmacSha256='a'.repeat(64);a.world.identityHmacSha256='b'.repeat(64);
 a.host.sourceCommit='c'.repeat(40);a.host.sourceSha256='d'.repeat(64);
 assert.equal(parse(a).captureStatus,'capture_assertions_passed_pending_independent_review');
});
test('unexpected secrets / raw logs / identifiers are forbidden',()=>{
 for(const change of [
  a=>a.host.hostname='private-host',
  a=>a.identities.playerName='user',
  a=>a.rawTestOutcome.stdout='raw log',
  a=>a.observedActions[0].chat='raw chat',
  a=>a.extra='unsafe'
 ]){
  const a=clone();change(a);assert.throws(()=>parse(a),/fields/);
 }
});
export {clone,parse,success};
