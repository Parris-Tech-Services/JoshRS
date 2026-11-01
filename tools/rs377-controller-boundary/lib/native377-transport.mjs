/**
 * Task 26: actual normal-377 TCP client + authenticated bot-only observer seam.
 * NO default live host, no local save access, no RS-SDK game server, no cheats.
 * The observer MUST be connected to a real, authorised #377 client/engine;
 * no source-only tool can manufacture that missing game-state producer.
 */
import {Session377} from '../../rs377-chatgpt-bridge/src/session.mjs';
import {createNative377Observer} from '../../rs377-chatgpt-bridge/src/native-observer.mjs';
import {action} from './guard.mjs';

const fail = why => { throw new Error(why); };
const number = x => Number.isSafeInteger(x) && x>=0;
const matchWorld = (s,botName,worldId) => {
  if(s.world?.mode!=='isolated' || s.world?.revision!==377 ||
     s.world?.tickMs!==600 || s.world?.xpMultiplier!==1 ||
     s.world?.instanceId!==worldId || !/^[a-f0-9]{40}$/i.test(s.world?.sourceSha??'') ||
     s.player?.username!==botName || s.player?.isBot!==true || !number(s.tick)) fail('untrusted_world_or_bot');
};
const itemAt = (s,slot) => {
  if(!Array.isArray(s.inventory)) fail('inventory_observation_missing');
  const item=s.inventory.find(i=>i.slot===slot);
  if(!item) fail('inventory_slot_not_observed');
  return item;
};
const locAt = (s,a) => {
  if(!Array.isArray(s.nearbyLocs) || !s.position ||
     !s.nearbyLocs.some(l=>l.id===a.locId && l.x===a.x && l.z===a.z))
    fail('location_not_observed');
};
const mapAction = (a,s) => {
  if(!s.position || !number(s.position.x) || !number(s.position.z)) fail('position_observation_missing');
  switch(a.type){
    case 'walk':
      if(Math.max(Math.abs(a.x-s.position.x),Math.abs(a.z-s.position.z))>104)
        fail('destination_too_far');
      return {type:'walk',x:a.x,z:a.z,running:false};
    case 'npc_option':
      if(!Array.isArray(s.nearbyNpcs)||!s.nearbyNpcs.some(n=>n.index===a.npcIndex))
        fail('npc_not_observed');
      return {type:'npc',npcSlot:a.npcIndex,option:a.option};
    case 'loc_option':
      locAt(s,a);return {type:'loc',x:a.x,z:a.z,locId:a.locId,option:a.option};
    case 'ground_take':
      if(!Array.isArray(s.groundItems)||
         !s.groundItems.some(i=>i.id===a.itemId&&i.x===a.x&&i.z===a.z))
        fail('ground_item_not_observed');
      return {type:'ground',x:a.x,z:a.z,itemId:a.itemId,option:1};
    case 'inventory_option':{
      const item=itemAt(s,a.slot);
      return {type:'held',componentId:3214,itemId:item.id,slot:a.slot,option:a.option};
    }
    case 'item_on_loc':{
      locAt(s,a);const item=itemAt(s,a.slot);
      return {type:'item_on_loc',x:a.x,z:a.z,locId:a.locId,componentId:3214,
        itemId:item.id,slot:a.slot};
    }
    case 'wait':return null;
    case 'dialog_option':fail('dialogue_component_not_verified');
    default:fail('forbidden_action');
  }
};
/** Resolves only if normal TCP login AND successive authenticated observations advance. */
export class Native377BoundaryTransport {
  constructor({session,nativeSource,observerToken,botName,worldId,proofTimeoutMs=5000}={}){
    if(!(session instanceof Session377) || session.identity!==botName ||
       session.target.mode!=='isolated')fail('isolated_native_session_required');
    if(typeof botName!=='string'||typeof worldId!=='string'||!/^isolated-[a-z0-9_-]{4,64}$/i.test(worldId))
      fail('explicit_bot_world_required');
    if(!Number.isInteger(proofTimeoutMs)||proofTimeoutMs<600||proofTimeoutMs>15000)
      fail('invalid_proof_timeout');
    this.session=session;this.botName=botName;this.worldId=worldId;
    this.observer=createNative377Observer(nativeSource,{
      botName,expectedWorld:worldId,token:observerToken
    });
    this.proofTimeoutMs=proofTimeoutMs;
    this.connected=false;this.connecting=false;
    this.last=null;this.lastAdvanceAt=0;
  }
  status(){return Object.freeze({authenticated:this.connected && this.session.status().authenticated,
    botName:this.botName,worldId:this.worldId,hasFreshWorldState:
    !!this.last && Date.now()-this.lastAdvanceAt<=3000});}
  async sample(){
    const s=await this.observer.observe();
    matchWorld(s,this.botName,this.worldId);
    if(this.last && s.tick<this.last.tick)fail('tick_regression');
    if(!this.last || s.tick>this.last.tick)this.lastAdvanceAt=Date.now();
    this.last=s;
    if(Date.now()-this.lastAdvanceAt>3000)fail('stale_game_tick');
    return s;
  }
  async connect(){
    if(this.connected||this.connecting)fail('duplicate_native_session');
    this.connecting=true;
    try{
      const login=await this.session.connect();
      if(login.authenticated!==true||!this.session.status().authenticated)
        fail('native_login_not_authenticated');
      const first=await this.sample();
      const end=Date.now()+this.proofTimeoutMs;
      let progressed=false;
      while(Date.now()<end){
        const s=await this.sample();
        if(s.tick>first.tick){progressed=true;break;}
        await new Promise(resolve=>setTimeout(resolve,Math.min(100,end-Date.now())));
      }
      if(!progressed)fail('no_advancing_authenticated_game_ticks');
      this.connected=true;
      return {authenticated:true,botName:this.botName,worldId:this.worldId,
        worldRevision:377,tickMs:600,sourceSha:this.last.world.sourceSha,
        source:'native377_tcp_plus_authenticated_bot_only_observer'};
    }catch(e){this.connected=false;this.session.close();throw e;}
    finally{this.connecting=false;}
  }
  async observe(){
    if(!this.connected||!this.session.status().authenticated)fail('native_not_authenticated');
    const s=await this.sample();
    if(s.position===null||s.inventory===null||s.skills===null||s.questStages===null)
      fail('required_native_state_missing');
    const xp=Object.fromEntries(s.skills.map(x=>[x.name,x.xpTenths]));
    return {observedAtMs:this.lastAdvanceAt,tick:s.tick,
      world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:s.world.instanceId},
      player:{username:this.botName,isBot:true,x:s.position.x,z:s.position.z,
        plane:s.position.plane,inventory:s.inventory.map(x=>({slot:x.slot,id:x.id,quantity:x.count})),
        xp,questStages:s.questStages,dialogue:s.dialogue}};
  }
  async dispatch(raw,{signal}={}){
    if(signal?.aborted) return {accepted:false,reason:'cancelled'};
    if(!this.connected||!this.session.status().authenticated)fail('native_not_authenticated');
    const a=action(raw);
    const s=await this.sample();
    if(signal?.aborted)return {accepted:false,reason:'cancelled'};
    const packet=mapAction(a,s);
    if(packet===null)return {accepted:true,phase:'wait_for_real_tick'};
    // Revalidate after asynchronous observer read, just before the native write.
    if(Date.now()-this.lastAdvanceAt>3000)fail('stale_game_tick');
    const result=this.session.send(packet);
    return {accepted:result.status==='dispatched_unverified'||result.status==='queued_unverified',
      phase:'dispatch_only',status:result.status};
  }
  close(){this.connected=false;this.last=null;this.session.close();}
}
