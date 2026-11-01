import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareDisposable,runIsolatedIntegration} from '../src/isolation.mjs';
import {rm} from 'node:fs/promises';
test('an unresponsive engine observer returns a bounded timeout, not false bot success',async()=>{
 const {manifest}=await prepareDisposable();
 try{
  const adapter={
    getWorldIdentity:()=>new Promise(()=>{}),
    observeBot:async()=>({player:{username:'HarnessTest'},tick:3}),
    dispatch:async()=>({accepted:true})
  };
  await assert.rejects(()=>runIsolatedIntegration({manifest,adapter,timeoutMs:100}),/timed out/);
  const good={...adapter,getWorldIdentity:async()=>({
    worldId:manifest.worldId,revision:377,mode:'isolated',tickMs:600,xpMultiplier:1,
    host:'127.0.0.1',gamePort:manifest.ports.game,account:manifest.account
  }),observeBot:()=>new Promise(()=>{})};
  await assert.rejects(()=>runIsolatedIntegration({manifest,adapter:good,timeoutMs:100}),/timed out/);
  await assert.rejects(()=>runIsolatedIntegration({manifest,adapter:good,timeoutMs:12000}),/Invalid adapter timeout/);
 }finally{await rm(manifest.root,{recursive:true,force:true});}
});
