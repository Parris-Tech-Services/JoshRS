/**
 * Task 26: actual normal-377 TCP client + authenticated bot-only observer seam.
 * NO default live host, no local save access, no RS-SDK game server, no cheats.
 * The observer MUST be connected to a real, authorised #377 client/engine;
 * no source-only tool can manufacture that missing game-state producer.
 */
import {Session377} from '../../rs377-chatgpt-bridge/src/session.mjs';
import {createNative377Observer} from '../../rs377-chatgpt-bridge/src/native-observer.mjs';
import {action} from './guard.mjs';
import {ReplayLedger} from './recovery.mjs';
import {BoundaryController} from './controller.mjs';
import {createLoopbackGateway} from './gateway.mjs';

/**
 * Real engine-backed observation source (task-24 management endpoint).
 * Always dials localhost; never redirects or trusts caller-chosen URLs.
 */
export function createLoopbackEngine377Source({port,token,fetchImpl=fetch}={}){
  if(!Number.isInteger(port)||port<1024||port>65535||
     [52402,8888,43500,45099].includes(port))throw new Error('isolated_observer_port_required');
  if(typeof token!=='string'||Buffer.byteLength(token)<32)throw new Error('strong_native_observer_token_required');
  if(typeof fetchImpl!=='function')throw new Error('fetch_implementation_required');
  const uri='http://127.0.0.1:'+port+'/dev/rs377-observe';
  return Object.freeze({async read(){
    const response=await fetchImpl(uri,{method:'GET',redirect:'error',
      headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(3000)});
    if(!response.ok)throw new Error('engine_observer_http_'+response.status);
    const body=await response.text();
    if(Buffer.byteLength(body)>65536)throw new Error('engine_observer_response_oversize');
    return JSON.parse(body);
  }});
}
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
    this.last=null;this.lastAdvanceAt=0;this.lastSampleAt=0;this.sampling=null;
  }
  status(){return Object.freeze({authenticated:this.connected && this.session.status().authenticated,
    botName:this.botName,worldId:this.worldId,hasFreshWorldState:
    !!this.last && Date.now()-this.lastAdvanceAt<=3000});}
  async sample(){
    // Engine's observation sequence is its 600ms tick, not a per-GET counter.
    // Prevent duplicate requests within a tick and collapse concurrent reads.
    if(this.last && Date.now()-this.lastSampleAt<600){
      if(Date.now()-this.lastAdvanceAt>3000)fail('stale_game_tick');
      return this.last;
    }
    if(this.sampling)return this.sampling;
    this.sampling=(async()=>{
      let s;
      try{s=await this.observer.observe();}
      catch(e){
        // Reading the same authenticated tick twice is not a new observation.
        if(e.message==='replayed_native_observation' && this.last &&
           Date.now()-this.lastAdvanceAt<=3000){
          this.lastSampleAt=Date.now();
          return this.last;
        }
        throw e;
      }
      matchWorld(s,this.botName,this.worldId);
      if(this.last && s.tick<this.last.tick)fail('tick_regression');
      if(!this.last || s.tick>this.last.tick)this.lastAdvanceAt=Date.now();
      this.last=s;this.lastSampleAt=Date.now();
      if(Date.now()-this.lastAdvanceAt>3000)fail('stale_game_tick');
      return s;
    })();
    try{return await this.sampling;}finally{this.sampling=null;}
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
    if(s.position===null||s.inventory===null)
      fail('required_native_state_missing');
    const xp=s.skills===null?null:Object.fromEntries(s.skills.map(x=>[x.name,x.xpTenths]));
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
  close(){this.connected=false;this.last=null;this.lastSampleAt=0;this.session.close();}
}

/**
 * Fail-closed recommended entrypoint. Unlike generic createLoopbackGateway,
 * this cannot start against a fixture-only controller or a loginless adapter.
 * The caller must separately install a trusted, authenticated real 377 observer.
 */
export async function startAuthenticated377Gateway({transport,ledger,authToken}={}){
  if(!(transport instanceof Native377BoundaryTransport))fail('native_transport_required');
  if(!(ledger instanceof ReplayLedger))fail('durable_replay_ledger_required');
  if(!transport.status().authenticated||!transport.status().hasFreshWorldState)
    fail('native_auth_and_fresh_ticks_required');
  await transport.observe(); // fails closed on expired auth, state, world or bot
  const controller=new BoundaryController({
    transport,ledger,botName:transport.botName,worldId:transport.worldId
  });
  const gateway=createLoopbackGateway(controller,{authToken});
  const address=await gateway.start();
  return {address,controller,gateway,
    async close(){await gateway.close();transport.close();}};
}
