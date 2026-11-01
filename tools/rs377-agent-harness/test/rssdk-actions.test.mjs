import test from 'node:test';
import assert from 'node:assert/strict';
import {toRsSdkAction,fromRsSdkAction} from '../src/rssdk-actions.mjs';
const examples=[
  {type:'walk',x:3222,z:3218},
  {type:'npc_option',npcIndex:9,option:1},
  {type:'loc_option',x:3222,z:3218,locId:42,option:1},
  {type:'ground_take',x:3222,z:3218,itemId:1933},
  {type:'inventory_option',slot:0,option:1},
  {type:'item_on_loc',slot:0,x:3222,z:3218,locId:88},
  {type:'dialog_option',option:0},
  {type:'wait',ticks:1}
];
test('all 8 normal Action377 variants round-trip through RS-SDK BotAction union',()=>{
  for(const a of examples){
    const b=toRsSdkAction(a);
    assert.equal(typeof b.reason,'string');
    assert.deepEqual(fromRsSdkAction(b),a);
  }
});
test('rejects privileged/unimplemented RS-SDK actions and guarded dialog without version evidence',()=>{
  for(const type of ['dropItem','shopBuy','bankWithdraw','spellOnPlayer','trade','privateMessage','acceptCharacterDesign','randomizeCharacterDesign','none','searchGE']){
    assert.throws(()=>fromRsSdkAction({type}),/Unsupported or privileged/);
  }
  assert.throws(()=>fromRsSdkAction({type:'clickDialogOption',optionIndex:1,guard:{pageId:'2',componentId:22}}),/Guarded dialog/);
});
