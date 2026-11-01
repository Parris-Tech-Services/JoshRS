import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseEvidenceCapture} from '../lib/capture.mjs';
const base=JSON.parse(readFileSync(new URL('../fixtures/evidence-capture.template.json',import.meta.url),'utf8'));
const parsed=a=>parseEvidenceCapture(JSON.stringify(a));
function passing(){
 const a=structuredClone(base);
 a.observedActions=[{at:'2026-11-02T00:00:00Z',actor:'bot',action:'walk',tick:5,result:'observed'}];
 a.rawTestOutcome={runner:'node_test',result:'pass',exitCode:0,stdoutSha256:null,stderrSha256:null};
 a.assertions=['normal_action','observed_effect','persistent_relogin'].map(name=>({name,outcome:'pass',failureCode:null}));
 return a;
}
test('hash and actual host provenance fields are validated',()=>{
 for(const mutate of [
  a=>a.host.sourceSha256='fake',
  a=>a.world.identityHmacSha256='world-id',
  a=>a.evidenceOrigin='operator-capture',
  a=>a.world.revision=400
 ]){const a=structuredClone(base);mutate(a);assert.throws(()=>parsed(a));}
});
test('failing assertion, nonzero successful exit and missing gameplay proof refused',()=>{
 for(const mutate of [
  a=>a.assertions[0].outcome='fail',
  a=>a.rawTestOutcome.exitCode=1,
  a=>a.assertions.pop(),
  a=>a.observedActions[0].result='sent',
  a=>a.world.mode='unknown',
  a=>a.assertions[0].failureCode='incorrect'
 ]){const a=passing();mutate(a);assert.throws(()=>parsed(a));}
});
test('chronology, fake actions, duplicate assertions and invalid dates refused',()=>{
 for(const mutate of [
  a=>a.observedActions[0].at='2026-11-02T00:00:02Z',
  a=>a.observedActions[0].action='grant_gold',
  a=>a.assertions.push({...a.assertions[0]}),
  a=>a.startedAt='2026-11-31T00:00:00Z'
 ]){const a=passing();mutate(a);assert.throws(()=>parsed(a));}
});
test('malformed/large JSON cannot be parsed',()=>{
 assert.throws(()=>parseEvidenceCapture('{'),/invalid_json/);
 assert.throws(()=>parseEvidenceCapture('x'.repeat(65537)),/capture_too_large/);
});
