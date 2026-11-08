import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyActionEffect} from '../src/sdk-action-effects.mjs';

function state(tick=10){
 return {
  tick,world:{instanceId:'isolated-action-evidence',sourceSha:'a'.repeat(40)},
  player:{username:'HarnessProof'},
  inventory:[{slot:0,id:1925,count:5},{slot:1,id:995,count:100}],
  equipment:[{slot:3,id:1277,count:1}],
  skills:[{name:'Magic',xpTenths:1000}],
  questStages:{barcrawl:0},
  dialogue:{isOpen:false,pageId:null},
  sdkDetails:{
   modalOpen:true,countDialog:{isOpen:true},combatStyle:{currentStyle:0},
   prayers:{activePrayers:Array(15).fill(false)},
   shop:{isOpen:true,shopItems:[{slot:10,id:1925,count:10}],playerItems:[]},
   bank:{isOpen:true,items:[{slot:50,id:1925,count:10}]},
   gameMessages:[]
  }
 };
}
const later=()=>structuredClone(state(12));
test('dispatch with later tick but unchanged native game state is never completion',()=>{
 const before=state(),after=later();
 for(const action of [
  {type:'dropItem',slot:0},{type:'bankWithdraw',slot:50,amount:5},
  {type:'shopBuy',slot:10,amount:1},{type:'togglePrayer',prayerIndex:2},
  {type:'talkToNpc',npcIndex:12},{type:'clickDialogOption',optionIndex:1},
  {type:'spellOnNpc',npcIndex:12,spellComponent:112},
  {type:'closeShop'},{type:'privateMessage',targetName:'HarnessOther'}
 ])assert.equal(verifyActionEffect(action,before,after),null,action.type);
});
test('native drop verifies item count actually fell; unrelated inventory changes do not count',()=>{
 const a=state(),b=later();b.inventory[0].count=3;
 assert.equal(verifyActionEffect({type:'dropItem',slot:0},a,b)?.verified,true);
 const c=later();c.inventory[1].count=50;
 assert.equal(verifyActionEffect({type:'dropItem',slot:0},a,c),null);
});
test('bank withdraw requires BOTH sides and exact quantity',()=>{
 const a=state(),b=later();
 b.sdkDetails.bank.items[0].count=5;b.inventory[0].count=10;
 assert.equal(verifyActionEffect({type:'bankWithdraw',slot:50,amount:5},a,b)?.verified,true);
 const c=later();c.inventory[0].count=10;
 assert.equal(verifyActionEffect({type:'bankWithdraw',slot:50,amount:5},a,c),null);
});
test('shop buy needs both real stock decrease and exact inventory increase',()=>{
 const a=state(),b=later();
 b.sdkDetails.shop.shopItems[0].count=9;b.inventory[0].count=6;
 assert.equal(verifyActionEffect({type:'shopBuy',slot:10,amount:1},a,b)?.verified,true);
 assert.equal(verifyActionEffect({type:'shopBuy',slot:10,amount:5},a,b),null);
});
test('native prayer toggle must flip the exact observed prayer bit',()=>{
 const a=state(),b=later();b.sdkDetails.prayers.activePrayers[2]=true;
 assert.equal(verifyActionEffect({type:'togglePrayer',prayerIndex:2},a,b)?.verified,true);
 assert.equal(verifyActionEffect({type:'togglePrayer',prayerIndex:3},a,b),null);
});
test('chat needs a new bot-owned native message, not arbitrary unrelated text',()=>{
 const a=state(),b=later();
 b.sdkDetails.gameMessages.push({tick:12,type:2,text:'Hi',fromSelf:true,sender:'HarnessProof'});
 assert.equal(verifyActionEffect({type:'say',message:'Hi'},a,b)?.verified,true);
 assert.equal(verifyActionEffect({type:'privateMessage',targetName:'H',message:'Hi'},a,b),null);
});
test('guard hand-in quest bit changes are observable, not directly writable',()=>{
 const a=state(),b=later();
 b.questStages.barcrawl=2;
 assert.equal(verifyActionEffect({type:'talkToNpc',npcIndex:12},a,b)?.verified,true);
 assert.equal(verifyActionEffect({type:'clickDialogOption',optionIndex:1},a,b)?.verified,true);
});
test('wrong bot, world or repeated/stale native tick never validates a packet effect',()=>{
 const a=state(),b=later();b.inventory[0].count=4;
 assert.equal(verifyActionEffect({type:'dropItem',slot:0},a,{...b,tick:10}),null);
 assert.equal(verifyActionEffect({type:'dropItem',slot:0},a,{...b,player:{username:'Elrothiro'}}),null);
 assert.equal(verifyActionEffect({type:'dropItem',slot:0},a,{...b,world:{instanceId:'other',sourceSha:'a'.repeat(40)}}),null);
});
