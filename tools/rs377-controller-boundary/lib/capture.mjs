/** Strict redacted Task 37 evidence parser. Does NOT prove a live session. */
import {reject} from './capture-schema.mjs';
import {checkMetadata} from './capture-meta.mjs';
import {checkRows} from './capture-rows.mjs';
export function parseEvidenceCapture(input){
 if(typeof input!=='string'||Buffer.byteLength(input,'utf8')>65536)reject('capture_too_large');
 let x;try{x=JSON.parse(input);}catch{reject('invalid_json');}
 const {start,end}=checkMetadata(x);
 const passed=checkRows(x,start,end);
 return {
  schemaVersion:1,kind:x.kind,evidenceOrigin:x.evidenceOrigin,
  host:{...x.host},world:{...x.world},identities:{...x.identities},
  startedAt:x.startedAt,endedAt:x.endedAt,
  observedActions:x.observedActions.map(a=>({...a})),
  rawTestOutcome:{...x.rawTestOutcome},
  assertions:x.assertions.map(a=>({...a})),
  captureStatus:!passed?x.rawTestOutcome.result:x.evidenceOrigin==='operator-capture'?
   'capture_assertions_passed_pending_independent_review':
   'fixture_assertions_passed_not_live',
  liveVerified:false
 };
}
