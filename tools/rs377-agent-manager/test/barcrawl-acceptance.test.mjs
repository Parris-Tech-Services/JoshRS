import test from 'node:test';
import assert from 'node:assert/strict';
import {BARS,decodeBarcrawl,createBarcrawlAcceptance} from '../barcrawl-acceptance.mjs';
const sha='a'.repeat(40),world='isolated-joshrs-qa';
const frame=(raw,card,tick=1)=>({
 world:{mode:'isolated',revision:377,instanceId:world,sourceSha:sha,tickMs:600,xpMultiplier:1},
 player:{username:'HarnessQA',isBot:true},tick,questStages:{barcrawl:raw},
 inventory:card?[{slot:0,id:123,name:'Barcrawl card',count:1}]:[]
});
const verifier=()=>createBarcrawlAcceptance({botName:'HarnessQA',worldId:world,sourceSha:sha});
const push=(v,raw,card,tick,id='session-aaaaaaa')=>v.observe({sessionId:id,snapshot:frame(raw,card,tick)});
const fullMask=()=>BARS.reduce((n,s)=>n|(1<<s.bit),0);
function ten(v){
 push(v,0,false,1);push(v,1,true,2);
 let bits=0;for(const [i,s] of BARS.entries()){bits|=(1<<s.bit);push(v,1|bits,true,i+3)}
 return bits;
}
test('ten distinct pub signatures, final guard handoff and actual second session required',()=>{
 const v=verifier(),bits=ten(v);
 assert.equal(v.report().passed,false);
 assert.equal(v.report().signatures.length,10);
 push(v,2|bits,false,13);
 assert.equal(v.report().handedIn,true);
 assert.equal(v.report().relogPersisted,false);
 let result=push(v,2|bits,false,14,'session-bbbbbbb');
 assert.equal(result.passed,true);
 assert.equal(result.liveWindowsPlaythroughVerified,false);
 assert.equal(result.status,'trace_contract_passed_provenance_not_attested');
});
test('all scripted or dispatched actions without native varp progression remain unverified',()=>{
 const v=verifier();push(v,0,false,1);push(v,1,true,2);
 for(let tick=3;tick<=12;tick++)push(v,1,true,tick);
 assert.equal(v.report().signatures.length,0);
 assert.equal(v.report().passed,false);
});
test('forged instant ten signatures fails',()=>{
 const v=verifier();push(v,0,false,1);push(v,1,true,2);
 assert.throws(()=>push(v,1|fullMask(),true,3),/more_than_one_signature/);
});
test('a handoff flag cannot conceal one missing pub',()=>{
 const v=verifier();push(v,0,false,1);push(v,1,true,2);
 let bits=0;
 BARS.slice(0,9).forEach((b,i)=>{bits|=1<<b.bit;push(v,bits|1,true,i+3)});
 assert.throws(()=>push(v,2|bits,false,12),/handoff_without_ten/);
});
test('reject card loss, premature relog, reused ticks, and wrong player',()=>{
 const a=verifier();push(a,0,false,1);push(a,1,true,2);
 assert.throws(()=>push(a,1,false,3),/lost_card/);
 const b=verifier();push(b,0,false,1);push(b,1,true,2);
 assert.throws(()=>push(b,1,true,3,'session-bbbbbbb'),/relogged_before/);
 const c=verifier();push(c,0,false,1);
 assert.throws(()=>push(c,0,false,1),/stale_or_replayed/);
 assert.throws(()=>c.observe({sessionId:'session-ccccccc',
   snapshot:{...frame(0,false,2),player:{username:'Elrothiro',isBot:false}}}),/wrong_world_or_account/);
});
test('reject family identity, missing varp, impossible state and card retained after handoff',()=>{
 assert.throws(()=>createBarcrawlAcceptance({botName:'Elrothiro',worldId:world,sourceSha:sha}),/disposable/);
 assert.throws(()=>decodeBarcrawl(undefined),/unknown_or_invalid/);
 assert.throws(()=>decodeBarcrawl(3),/invalid_quest_stage/);
 const v=verifier(),bits=ten(v);
 assert.throws(()=>push(v,2|bits,true,13),/card_still_in_inventory/);
});
test('no relog flag from repeated observation in the same session',()=>{
 const v=verifier(),bits=ten(v);push(v,2|bits,false,13);
 push(v,2|bits,false,14);
 assert.equal(v.report().passed,false);
});
