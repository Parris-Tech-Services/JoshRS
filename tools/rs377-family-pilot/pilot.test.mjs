import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validatePilot,checkFiles,getCrc,WAYPOINTS,classifyBotPosition,readBotPosition} from './pilot.mjs';
import {Session377} from '../rs377-chatgpt-bridge/src/session.mjs';

test('family world requires explicit approval and bot-only credentials',()=>{
  assert.throws(()=>validatePilot({mode:'--run',approval:'',password:'a'}),/approval|requires/);
  assert.throws(()=>validatePilot({mode:'--run',approval:'YES'}),/password/);
  assert.throws(()=>validatePilot({mode:'--run',approval:'YES',name:'elrothiro',password:'a'}),/HarnessScout/);
  assert.equal(validatePilot({mode:'--check'}),true);
});
test('only pre-existing family Elrothiro save and local RSA key unlock preflight',()=>{
  const root=mkdtempSync(path.join(tmpdir(),'joshrs-family-pilot-'));
  try{
    assert.throws(()=>checkFiles(root),/Elrothiro save/);
    const game=path.join(root,'engine/data/players/main');
    const keys=path.join(root,'engine/data/config');
    mkdirSync(game,{recursive:true});mkdirSync(keys,{recursive:true});
    writeFileSync(path.join(game,'elrothiro.sav'),'user-existing-save');
    assert.throws(()=>checkFiles(root),/key missing/);
    writeFileSync(path.join(keys,'private.pem'),'fixture-only-no-real-secrets');
    assert.equal(checkFiles(root).engine,path.join(root,'engine'));
  }finally{rmSync(root,{recursive:true,force:true})}
});
test('CRC cannot be fabricated when the game endpoint is absent',async()=>{
  await assert.rejects(getCrc(async()=>{throw new Error('offline')}),/did not supply/);
  await assert.rejects(getCrc(async()=>({ok:true,arrayBuffer:async()=>new Uint8Array(5).buffer})),/did not supply/);
  const crc=await getCrc(async()=>({ok:true,arrayBuffer:async()=>new Uint8Array(36).fill(12).buffer}));
  assert.equal(crc.length,36);
});
test('bounded patrol contains only ordinary Lumbridge walking coordinates',()=>{
  assert.equal(WAYPOINTS.length,4);
  assert.ok(WAYPOINTS.every(({x,z})=>Number.isInteger(x)&&Number.isInteger(z)&&x>=3200&&x<=3250&&z>=3190&&z<=3240));
});
test('native 377 session rejects family target without approval and non-Harness names',()=>{
  assert.throws(()=>new Session377({target:{host:'127.0.0.1',port:52402,mode:'family'},
    username:'HarnessScout',password:'a',publicKeyPem:'example',crcs:Buffer.alloc(36)}),/requires explicit approval/);
  assert.throws(()=>new Session377({target:{host:'127.0.0.1',port:52402,mode:'family',approvedFamily:true},
    username:'elrothiro',password:'a',publicKeyPem:'example',crcs:Buffer.alloc(36)}),/disposable Harness/);
});

test('saved tutorial character cannot be treated as Lumbridge or routed past the island',()=>{
  assert.equal(classifyBotPosition({x:3094,z:3106,level:0}),'TUTORIAL_ISLAND');
  assert.equal(classifyBotPosition({x:3082,z:9504,level:0}),'TUTORIAL_ISLAND');
  assert.equal(classifyBotPosition({x:3233,z:3218,level:0}),'LUMBRIDGE_PATROL_AREA');
  assert.equal(classifyBotPosition({x:3222,z:3218,level:1}),'OTHER_LOCATION');
  assert.equal(classifyBotPosition({x:2662,z:3305,level:0}),'OTHER_LOCATION');
});
test('native bot save position is read without mutation; existing account can be reused only after tutorial',()=>{
  const root=mkdtempSync(path.join(tmpdir(),'joshrs-bot-position-'));
  try {
    const save=path.join(root,'harnessscout.sav');
    assert.equal(readBotPosition(save),null);
    const original=Buffer.alloc(48);original.writeUInt16BE(0x2004,0);
    original.writeUInt16BE(3094,4);original.writeUInt16BE(3106,6);original[8]=0;
    writeFileSync(save,original);
    const position=readBotPosition(save);
    assert.deepEqual(position,{x:3094,z:3106,level:0,region:'TUTORIAL_ISLAND'});
    assert.deepEqual(readFileSync(save),original);
    original.writeUInt16BE(3233,4);original.writeUInt16BE(3218,6);
    writeFileSync(save,original);
    assert.equal(readBotPosition(save).region,'LUMBRIDGE_PATROL_AREA');
    original[0]=0;writeFileSync(save,original);
    assert.throws(()=>readBotPosition(save),/Unrecognised/);
  } finally {rmSync(root,{recursive:true,force:true})}
});
