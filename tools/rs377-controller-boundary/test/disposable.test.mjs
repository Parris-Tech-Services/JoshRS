import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDisposable377} from '../lib/disposable.mjs';
const safe={host:'127.0.0.1',gamePort:53402,webPort:8988,saveRoot:'/tmp/rs377-disposable-fixture',account:'FixtureBot',worldId:'isolated-fixture',explicitDisposable:true};
test('accepts explicit isolated nonproduction settings without launching',()=>assert.equal(validateDisposable377(safe).gamePort,53402));
test('rejects real family game/web ports',()=>{for(const gamePort of [52402,8888,45099,43500])assert.throws(()=>validateDisposable377({...safe,gamePort}),/unsafe_gamePort/);});
test('rejects production save roots and unknown world',()=>{
 for(const saveRoot of ['/home/josh/dev/JoshRS/saves','/','/tmp/production','/tmp/rs377-disposable-family'])assert.throws(()=>validateDisposable377({...safe,saveRoot}),/save_root/);
 assert.throws(()=>validateDisposable377({...safe,worldId:'family'}),/disposable_world/);
});
test('rejects remote hosts, account mismatch and port collision',()=>{
 assert.throws(()=>validateDisposable377({...safe,host:'192.168.1.1'}),/loopback/);
 assert.throws(()=>validateDisposable377({...safe,account:'Elrothiro'}),/disposable_account/);
 assert.throws(()=>validateDisposable377({...safe,webPort:safe.gamePort}),/collision/);
});
