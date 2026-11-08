import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validatePilot,checkFiles,getCrc,WAYPOINTS} from './pilot.mjs';
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
