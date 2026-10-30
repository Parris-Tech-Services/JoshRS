import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,collect,deliver,REQUIRED} from '../gameplay.mjs';
test('all three unique specimens required',()=>{
 let state=newState();
 assert.equal(deliver(state).ok,false);
 for(const id of REQUIRED)state=collect(state,id).state;
 const win=deliver(state);
 assert.equal(win.ok,true);
 assert.equal(win.state.coins,125);
 assert.equal(win.state.questPoints,1);
 assert.equal(deliver(win.state).ok,false);
});
test('unknown and duplicate specimens never advance state',()=>{
 const first=collect(newState(),'specimen_clay');
 assert.equal(collect(first.state,'specimen_clay').ok,false);
 assert.equal(collect(first.state,'unknown').ok,false);
});
