import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBotOnlyManager} from './mcp-session.mjs';
import {BOT,WORLD,validateSecrets,readSecrets,verifyApproval} from './mcp-private.mjs';
import {safeRequestBot} from './mcp-server.mjs';

test('MCP startup never authorises any other family character',()=>{
 assert.equal(safeRequestBot(BOT),'HarnessView1');
 for(const name of ['Elrothiro','Sylvie','harnessview1','HarnessView2',null,undefined,''])
  assert.throws(()=>safeRequestBot(name),/HarnessView1 only/);
 assert.throws(()=>verifyApproval({}),/authorisation/);
 assert.doesNotThrow(()=>verifyApproval({JOSHRS_FAMILY_SDK_APPROVED:BOT}));
});
test('configuration rejects extra fields, weak tokens and non-377 bot password strings',()=>{
 const good={observerToken:'z'.repeat(64),botPassword:'HarnessOnly2026'};
 assert.deepEqual(validateSecrets(good),good);
 for(const bad of [
  {...good,username:'Elrothiro'}, {...good,observerToken:'short'},
  {...good,botPassword:''},{...good,botPassword:'x'.repeat(21)},
  {...good,observerToken:'a\n'.repeat(40)}, null,[],{}
 ])assert.throws(()=>validateSecrets(bad));
});
test('private credentials require regular file, owned 0700 directory and 0600 file',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-mcp-fixture-'));
 const file=path.join(directory,'secrets.json');
 const example={observerToken:'T'.repeat(64),botPassword:'HarnessOnly'};
 try{
  fs.chmodSync(directory,0o700);
  fs.writeFileSync(file,JSON.stringify(example),{mode:0o600,flag:'wx'});
  assert.equal(readSecrets(file).observerToken,example.observerToken);
  fs.chmodSync(file,0o644);
  assert.throws(()=>readSecrets(file),/private_0600/);
  fs.chmodSync(file,0o600);
  fs.chmodSync(directory,0o755);
  assert.throws(()=>readSecrets(file),/private_0700/);
  fs.chmodSync(directory,0o700);
  const link=path.join(directory,'link.json');
  fs.symlinkSync(file,link);
  assert.throws(()=>readSecrets(link),/private_0600/);
 }finally{fs.chmodSync(directory,0o700);fs.rmSync(directory,{recursive:true,force:true})}
});
test('one active SDK client per bot, never a second controller or other account',async()=>{
 let started=0,stopped=0,connected=true,authenticated=true;
 const fake=async()=>{
  started++;
  return {
   sdk:{isConnected:()=>connected,getState:()=>({inGame:true,tick:12,player:{name:BOT}})},
   bot:{walkTo:async()=>({success:false,reason:'not_observed'})},
   native:{status:()=>({authenticated})},
   cleanup:async()=>{stopped++;connected=false}
  };
 };
 const manager=createBotOnlyManager(fake);
 assert.deepEqual(manager.list(),[]);
 await assert.rejects(()=>manager.connect('Sylvie'),/HarnessView1/);
 assert.equal(started,0);
 const [a,b]=await Promise.all([manager.connect(BOT),manager.connect(BOT)]);
 assert.equal(started,1);
 assert.equal(a,b);
 assert.equal(manager.get(BOT),a);
 assert.equal(manager.get('Elrothiro'),undefined);
 assert.deepEqual(manager.list(),[{name:BOT,username:BOT,connected:true}]);
 const repeated=await manager.connect(BOT);
 assert.equal(repeated,a);
 assert.equal(started,1);
 authenticated=false;
 assert.equal(manager.get(BOT),undefined);
 await manager.disconnect(BOT);
 assert.equal(stopped,1);
 assert.deepEqual(manager.list(),[]);
 await manager.disconnect(BOT);
 assert.equal(stopped,1);
 await assert.rejects(()=>manager.disconnect('Elrothiro'),/HarnessView1/);
});
test('native MCP source never starts/stops server or copies privileged player data',()=>{
 const src=fs.readFileSync(new URL('./mcp-session.mjs',import.meta.url),'utf8');
 const mcp=fs.readFileSync(new URL('./mcp-server.mjs',import.meta.url),'utf8');
 assert.match(src,/createSdk377Runtime/);
 assert.match(src,/createSdk377WebSocket/);
 assert.match(src,/Session377/);
 assert.match(mcp,/executeCode\(manager,BOT/);
 assert.match(mcp,/new StdioServerTransport/);
 assert.doesNotMatch(src,/systemctl|setVarp|writeFileSync|invAdd|grantXp|exec\(/);
 assert.doesNotMatch(mcp,/autoLaunchBrowser:true|restartServer|password:/);
});
