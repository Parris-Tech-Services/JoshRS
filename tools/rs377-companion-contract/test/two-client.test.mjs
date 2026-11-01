import test from 'node:test';
import assert from 'node:assert/strict';
import {checkTwoClientAcceptance,sourceAnchors} from '../src/two-client.mjs';
const worldId='isolated-testworld-01';
function makeEvent(observer,type,tick,extra={}){
 return {source:'java-client-377',type,tick,observer,
   sessionId:observer==='Elrothiro'?'java-owner-client-A':'java-bot-client-B',
   worldId,captureId:observer+'-read-only-test',...extra};
}
function events(){
 const a=(type,tick,extra)=>makeEvent('Elrothiro',type,tick,extra);
 const b=(type,tick,extra)=>makeEvent('HarnessTest',type,tick,extra);
 return [
  a('client_login',1),b('client_login',2),
  a('players_visible',4,{players:['HarnessTest']}),b('players_visible',4,{players:['Elrothiro']}),
  a('player_moved',10,{player:'HarnessTest',x:3222,z:3218}),
  a('player_moved',11,{player:'HarnessTest',x:3225,z:3218}),
  a('friend_status',8,{player:'HarnessTest',online:true}),
  a('follow_observed',12,{follower:'HarnessTest',target:'Elrothiro',pathMovementObserved:true}),
  b('public_chat',13,{sender:'HarnessTest',textId:'chat-seq-001'}),
  a('public_chat',14,{sender:'HarnessTest',textId:'chat-seq-001'}),
  b('bot_save_state',15,{inventory:[{id:1511,quantity:2}],xp:{Woodcutting:175}}),
  b('client_logout',16),a('friend_status',17,{player:'HarnessTest',online:false}),
  b('client_relogin',19),b('bot_save_state',20,{inventory:[{id:1511,quantity:2}],xp:{Woodcutting:175}})
 ];
}
test('two distinct Java client fixture assertions work but fixture does NOT claim live verification',()=>{
 const report=checkTwoClientAcceptance({events:events(),evidenceOrigin:'fixture',worldId});
 assert.equal(report.status,'blocked');
 assert.deepEqual(report.missing,['not_an_independently_reviewed_real_client_capture']);
});
test('source-backed contract accepts internally consistent real-labelled capture pending independent review',()=>{
 const report=checkTwoClientAcceptance({events:events(),evidenceOrigin:'real-client-capture',worldId});
 assert.equal(report.status,'capture_assertions_passed_pending_independent_review');
 assert.equal(report.clients,2);
 assert.equal(report.missing.length,0);
 assert.match(report.note,/not cryptographic/);
 const refs=sourceAnchors();
 assert.match(refs.javaLogin,/Client-Java@327880f/);
 assert.match(refs.movement,/MoveClickHandler/);
});
test('server-only telemetry cannot substitute for seeing a real bot in Java client',()=>{
 const data=events().map(e=>({...e,source:'server_bot_report'}));
 const r=checkTwoClientAcceptance({events:data,evidenceOrigin:'real-client-capture',worldId});
 assert.equal(r.status,'blocked');
 assert.ok(r.missing.includes('invalid_or_server_only_event'));
});
test('rejects separate worlds even if both show someone with the right username',()=>{
 const data=events();data.find(e=>e.observer==='HarnessTest').worldId='isolated-another';
 const r=checkTwoClientAcceptance({events:data,evidenceOrigin:'real-client-capture',worldId});
 assert.ok(r.missing.includes('different_or_unknown_worlds'));
});
test('rejects a single Java session pretending to be both clients',()=>{
 const data=events().map(e=>({...e,sessionId:'one-shared-client'}));
 const r=checkTwoClientAcceptance({events:data,evidenceOrigin:'real-client-capture',worldId});
 assert.ok(r.missing.includes('client_sessions_not_independent'));
});
test('missing observed follow, chat or friend-offline transition cannot be inferred',()=>{
 const data=events().filter(e=>!['follow_observed','public_chat'].includes(e.type)&&
   !(e.type==='friend_status'&&e.online===false));
 const r=checkTwoClientAcceptance({events:data,evidenceOrigin:'real-client-capture',worldId});
 assert.ok(r.missing.includes('follow_from_two_client_world_state'));
 assert.ok(r.missing.includes('bot_chat_seen_by_other_java_client'));
 assert.ok(r.missing.includes('friend_offline_seen_by_owner'));
});
test('relogin must preserve inventory and experience; fake progression is not accepted',()=>{
 const data=events();
 const last=data.findLast(e=>e.type==='bot_save_state');last.inventory=[{id:1511,quantity:99}];
 const r=checkTwoClientAcceptance({events:data,evidenceOrigin:'real-client-capture',worldId});
 assert.ok(r.missing.includes('inventory_xp_persist_after_relogin'));
 const grants=events();grants.push(makeEvent('HarnessTest','client_login',25,{claims:['admin_grant']}));
 const g=checkTwoClientAcceptance({events:grants,evidenceOrigin:'real-client-capture',worldId});
 assert.ok(g.missing.includes('unauthorised_or_mock_evidence'));
});
