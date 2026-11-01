import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine377Observer} from '../src/engine-observer.mjs';
const token='fixture-token-for-observer-123456789';
const observation={world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:'isolated-test-world',sourceSha:'a'.repeat(40)},player:{username:'HarnessBot',isBot:true},tick:10,position:{x:3200,z:3200,plane:0},skills:null,inventory:[{slot:0,id:1925,count:1}],equipment:null,nearbyNpcs:null,nearbyLocs:null,groundItems:null,dialogue:null,questStages:null,sdkDetails:null};
test('reads engine-originated HTTP payload via native callback',async()=>{
 let requested='';
 const fetchImpl=async(url,options)=>{requested=url;assert.equal(options.headers.authorization,'Bearer '+token);return {ok:true,text:async()=>JSON.stringify({token,sequence:10,observation})}};
 const o=createEngine377Observer({port:8989,token,botName:'HarnessBot',expectedWorld:'isolated-test-world',fetchImpl});
 const s=await o.observe();assert.equal(s.inventory[0].id,1925);assert.equal(requested,'http://127.0.0.1:8989/dev/rs377-observe');
});
test('refuses production management ports and non-200 engine responses',async()=>{
 assert.throws(()=>createEngine377Observer({port:8888,token,botName:'HarnessBot',expectedWorld:'isolated-test-world'}),/port/);
 const o=createEngine377Observer({port:8989,token,botName:'HarnessBot',expectedWorld:'isolated-test-world',fetchImpl:async()=>({ok:false,status:404})});
 await assert.rejects(()=>o.observe(),/http_404/);
});
