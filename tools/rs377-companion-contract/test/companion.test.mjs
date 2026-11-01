import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanion} from '../src/companion.mjs';
function snapshot(tick=10){
 return {world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:'isolated-testworld-01'},tick,
 player:{username:'HarnessTest',isBot:true,x:3220,z:3218,plane:0,inventory:[],xp:{Woodcutting:0}},
 nearbyPlayers:[{username:'Elrothiro',online:true,x:3228,z:3218,plane:0}],nearbyLocs:[]};
}
test('default stop means no movement, and only authenticated owner public chat selects bounded mode',()=>{
 const p=createCompanion();
 assert.equal(p.getMode(),'stop');
 assert.equal(p.next(snapshot()).status,'stopped');
 assert.equal(p.acceptChat({authenticated:false,channel:'public',sender:'Elrothiro',text:'bot follow'}).accepted,false);
 assert.equal(p.acceptChat({authenticated:true,channel:'private',sender:'Elrothiro',text:'bot follow'}).accepted,false);
 assert.equal(p.acceptChat({authenticated:true,channel:'public',sender:'OtherPlayer',text:'bot follow'}).accepted,false);
 assert.equal(p.acceptChat({authenticated:true,channel:'public',sender:'Elrothiro',text:'bot follow'}).accepted,true);
 assert.equal(p.getMode(),'follow');
});
test('chat/LLM command injection is treated as untrusted text; no code or admin execution',()=>{
 const p=createCompanion();
 for(const text of ['bot follow; rm -rf /','bot follow && sudo reboot','bot follow\n!admin','execute_code','bot teleport','bot give 10000 coins','bot follow ${process.env.PASSWORD}']){
  const r=p.acceptChat({authenticated:true,channel:'public',sender:'Elrothiro',text});
  assert.equal(r.accepted,false,text);
 }
 assert.equal(p.getMode(),'stop');
 assert.equal(p.setMode('gather',{authenticated:false}).accepted,false);
});
test('follow uses only a short walk within normal path intent; no teleports or unobserved owner',()=>{
 const p=createCompanion();
 p.setMode('follow',{authenticated:true});
 const planned=p.next(snapshot());
 assert.equal(planned.status,'planned');
 assert.deepEqual(planned.action,{type:'walk',x:3224,z:3218});
 assert.equal(p.next(snapshot(11)).reason,'cooldown');
 const far=snapshot(12);far.nearbyPlayers[0].x=3300;
 assert.equal(p.next(far).status,'blocked');
 const unseen=snapshot(13);unseen.nearbyPlayers=[];
 assert.equal(p.next(unseen).reason,'owner_not_visible_on_same_plane');
});
test('assist remains positional until legitimate native combat actions exist',()=>{
 const p=createCompanion();p.setMode('assist',{authenticated:true});
 const result=p.next(snapshot());
 assert.equal(result.action.type,'walk');
 const s=snapshot(12);s.player.x=3227;
 assert.equal(p.next(s).reason,'assisting_near_owner');
});
test('gather requires real normal equipment and observed tree rather than item creation',()=>{
 const p=createCompanion({axeItemId:1351,treeObjectId:1276});
 p.setMode('gather',{authenticated:true});
 assert.equal(p.next(snapshot()).reason,'axe_must_be_obtained_legitimately');
 const s=snapshot(12);s.player.inventory=[{slot:0,id:1351,quantity:1}];
 s.nearbyLocs=[{id:1276,x:3221,z:3218,plane:0,options:['Chop down']}];
 const a=p.next(s);assert.equal(a.status,'planned');assert.equal(a.action.type,'loc_option');
 assert.equal(a.requires,'observed_log_and_normal_xp_change');
});
test('wrong account, world identity, accelerated ticks and XP are refused',()=>{
 const p=createCompanion();p.setMode('follow',{authenticated:true});
 for(const tamper of [
  s=>{s.player.username='Elrothiro';},
  s=>{s.world.revision=317;},
  s=>{s.world.xpMultiplier=8;},
  s=>{s.world.tickMs=400;},
  s=>{s.world.mode='family';}
 ]){const s=snapshot();tamper(s);assert.throws(()=>p.next(s));}
});
test('world generation and world ticks cannot change under controller lease',()=>{
 const p=createCompanion();p.setMode('follow',{authenticated:true});
 p.next(snapshot(20));
 const s=snapshot(21);s.world.instanceId='isolated-otherworld';
 assert.throws(()=>p.next(s),/generation changed/);
 assert.throws(()=>p.next(snapshot(19)),/regressed/);
});
test('stop cancels future planning even after a legitimate earlier movement',()=>{
 const p=createCompanion();p.setMode('follow',{authenticated:true});p.next(snapshot());
 assert.equal(p.acceptChat({authenticated:true,channel:'public',sender:'Elrothiro',text:'bot stop'}).accepted,true);
 assert.equal(p.next(snapshot(11)).action,null);
});
