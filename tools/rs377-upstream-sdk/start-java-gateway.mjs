#!/usr/bin/env node
/**
 * A SINGLE real Java 377 game client (logged into isolated Harness account)
 * drives all mapped original RS-SDK packets. No second parallel game login.
 * All secrets are environment-only. Never starts or restarts the family world.
 */
import {createNativeClient377Control} from '../rs377-chatgpt-bridge/src/java-client-control.mjs';
import {createJavaClient377Session} from '../rs377-chatgpt-bridge/src/java-client-session.mjs';
import {createEngine377Observer} from '../rs377-chatgpt-bridge/src/engine-observer.mjs';
import {createSdk377Runtime} from '../rs377-chatgpt-bridge/src/sdk-runtime.mjs';
import {createSdk377WebSocket} from '../rs377-chatgpt-bridge/src/sdk-websocket.mjs';

const required=k=>{
 const v=process.env[k];if(!v)throw Error('Isolated Java SDK gateway: missing '+k);
 return v;
};
const int=k=>{
 const v=Number(required(k));if(!Number.isSafeInteger(v))throw Error('Bad port '+k);
 return v;
};
if(process.env.JOSHRS_377_CLIENT_CONTROL_ENABLED!=='true'||
  process.env.NODE_PROFILE!=='joshrs_ci_377'||
  process.env.RS377_OBSERVER_ISOLATED!=='true'||
  process.env.RS377_OBSERVER_ENABLED!=='true'||
  process.env.NODE_XPRATE!=='1')
 throw Error('Only disposable isolated rev377 profile and normal XP are supported');
const bot=required('RS377_OBSERVER_BOT');
const world=required('RS377_OBSERVER_WORLD');
if(!/^Harness[A-Za-z0-9_-]{1,10}$/.test(bot)||
   !/^isolated-[a-z0-9_-]{4,64}$/i.test(world)||
   required('JOSHRS_377_CLIENT_CONTROL_BOT')!==bot||
   required('JOSHRS_377_CLIENT_CONTROL_WORLD')!==world)
 throw Error('Native Java and server observer must refer to the SAME isolated bot/world');
const port=int('JOSHRS_377_CLIENT_CONTROL_PORT');
const gamePort=int('JOSHRS_377_CLIENT_GAME_PORT');
const wsPort=int('RS377_SDK_GATEWAY_PORT');
if(![15402].includes(gamePort))throw Error('Must be the approved disposable rev377 game port, never 52402');
if(port===wsPort||port===int('WEB_MANAGEMENT_PORT')||
  [8888,52402,15402,18880,18881].includes(port)||
  [8888,52402,15402,18880,18881].includes(wsPort))
 throw Error('Private isolated control ports must not overlap game/family ports');
const control=createNativeClient377Control({
 port,botName:bot,worldId:world,token:required('JOSHRS_377_CLIENT_CONTROL_TOKEN')
});
const session=await createJavaClient377Session(control);
const observer=createEngine377Observer({
 port:int('WEB_MANAGEMENT_PORT'),token:required('RS377_OBSERVER_TOKEN'),
 botName:bot,expectedWorld:world
});
let first;
for(let i=0;i<5;i++){
 try{first=await observer.observe();break}
 catch(error){
  if(i===4)throw error;
  await new Promise(done=>setTimeout(done,700));
 }
}
if(first.world?.revision!==377||first.world?.instanceId!==world||
   first.player?.username!==bot||first.player?.isBot!==true)
 throw Error('Actual native server did not authenticate matching Java bot and isolated world');
const runtime=createSdk377Runtime({session,observer,botName:bot,
 expectedWorld:world,clientControl:control});
const gateway=createSdk377WebSocket({
 runtime,botName:bot,token:required('RS377_SDK_TOKEN')
});
const address=await gateway.listen(wsPort);
console.log('JAVA377_SINGLE_SESSION_GATEWAY_READY: '+address.host+':'+address.port);
console.log('Original upstream SDK now has one isolated real Java game session, not two logins.');
console.log('No quest or save/relog verification has been claimed.');
let closing=false;
const shutdown=async()=>{
 if(closing)return;closing=true;
 await gateway.close();await session.disconnect();
};
process.on('SIGINT',()=>{void shutdown().then(()=>process.exit(0)).catch(()=>process.exit(1))});
process.on('SIGTERM',()=>{void shutdown().then(()=>process.exit(0)).catch(()=>process.exit(1))});
