/**
 * Local JoshRS disposable-account agent fleet. No default credentials, no
 * family login, no direct Player/XP/inventory manipulation. One controller
 * per bot. Only actions whose effects can be observed are counted.
 */
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const VALID_NAME=/^Harness[A-Za-z0-9_-]{1,10}$/;
const GOALS=new Set(['idle','explore','woodcut','talk']);
export function validateProfile({name,goal}={}){
  if(typeof name!=='string'||!VALID_NAME.test(name))throw new Error('disposable_Harness_name_required');
  if(!GOALS.has(goal))throw new Error('unsupported_goal_choose_idle_explore_woodcut_or_talk');
  return Object.freeze({name,goal});
}
export class AgentFleet{
  constructor({adapterFactory,onChange=()=>{}}={}){
    if(typeof adapterFactory!=='function')throw new Error('agent_adapter_required');
    this.adapterFactory=adapterFactory;
    this.onChange=onChange;
    this.entries=new Map();
  }
  add(profile){
    const p=validateProfile(profile);
    if(this.entries.has(p.name.toLowerCase()))throw new Error('agent_name_already_exists');
    this.entries.set(p.name.toLowerCase(),{
      profile:p,phase:'stopped',goal:p.goal,adapter:null,
      task:null,abort:null,verifiedSteps:0,verifiedActivities:0,lastVerified:null,error:null
    });
    this.onChange();
    return p;
  }
  get(name){
    const entry=this.entries.get(String(name).toLowerCase());
    if(!entry)throw new Error('unknown_disposable_agent');
    return entry;
  }
  list(){
    return [...this.entries.values()].map(e=>({
      name:e.profile.name,goal:e.goal,phase:e.phase,
      verifiedSteps:e.verifiedSteps,verifiedActivities:e.verifiedActivities,lastVerified:e.lastVerified,error:e.error,
      nativeSaveVerified:false,fullSdkStateVerified:false,questingVerified:false
    }));
  }
  setGoal(name,goal){
    if(!GOALS.has(goal))throw new Error('unsupported_goal');
    const e=this.get(name);e.goal=goal;this.onChange();
  }
  async start(name,password){
    const e=this.get(name);
    if(e.phase!=='stopped'&&e.phase!=='error')throw new Error('agent_already_started');
    if(typeof password!=='string'||password.length<8||password.length>20||!/^\x21-\x7e+$/.test(password))
      throw new Error('native_377_password_must_be_8_to_20_printable_ASCII_characters');
    e.phase='connecting';e.error=null;e.abort=new AbortController();this.onChange();
    const signal=e.abort.signal;
    try{
      // The secret is held only by the requested native adapter; it is NEVER
      // copied into a profile, log, JSON status, or repository source file.
      const adapter=await this.adapterFactory({name:e.profile.name,password});
      e.adapter=adapter;
      if(signal.aborted){await adapter.close();e.adapter=null;e.phase='stopped';return}
      await adapter.connect();
      if(signal.aborted){await adapter.close();e.adapter=null;e.phase='stopped';return}
      await adapter.observe();
      e.phase='running';this.onChange();
      e.task=this.run(e,signal);
    }catch(error){
      e.phase='error';e.error=String(error?.message??error).slice(0,140);
      if(e.adapter)try{await e.adapter.close()}catch{}
      e.adapter=null;this.onChange();
      throw new Error('agent_start_failed_'+e.error);
    }
  }
  pause(name){
    const e=this.get(name);
    if(e.phase!=='running')throw new Error('agent_not_running');
    e.phase='paused';this.onChange();
    return {paused:true};
  }
  resume(name){
    const e=this.get(name);
    if(e.phase!=='paused')throw new Error('agent_not_paused');
    e.phase='running';this.onChange();
    return {resumed:true};
  }
  async stop(name){
    const e=this.get(name);
    if(e.phase==='stopped')return {status:'already_stopped',saveVerified:false};
    e.phase='stopping';e.abort?.abort();this.onChange();
    // Do NOT force-kill or rewrite saves. End the authenticated TCP session;
    // confirmation of engine save/relog is a distinct integration gate.
    if(e.adapter)try{await e.adapter.close()}catch{}
    if(e.task)try{await e.task}catch{}
    e.adapter=null;e.task=null;e.abort=null;e.phase='stopped';this.onChange();
    return {status:'closed_unverified_save',saveVerified:false};
  }
  async run(e,signal){
    const directions=[[1,0],[0,1],[-1,0],[0,-1]];
    let cursor=0;
    try{
      while(!signal.aborted){
        if(e.phase!=='running'||e.goal==='idle'){await sleep(180);continue}
        if(e.goal==='woodcut'){
          await this.woodcut(e,signal);
          continue;
        }
        if(e.goal==='talk'){
          await this.talk(e,signal);
          continue;
        }
        const first=await e.adapter.observe();
        if(!first.position)throw new Error('native_position_unavailable');
        let verified=false;
        // Never spam rejected, blocked or impossible tiles. Each action is a
        // normal, independently authenticated rev377 movement click.
        for(let attempt=0;attempt<4&&!signal.aborted&&e.phase==='running';attempt++){
          const [dx,dz]=directions[(cursor++)%4];
          const target={x:first.position.x+dx,z:first.position.z+dz};
          const dispatched=await e.adapter.move(target);
          if(!['queued_unverified','dispatched_unverified'].includes(dispatched.status))
            throw new Error('normal_movement_not_dispatched');
          for(let poll=0;poll<6&&!signal.aborted;poll++){
            await sleep(700);
            if(e.phase!=='running')break;
            const actual=await e.adapter.observe();
            if(actual.position?.x===target.x&&actual.position?.z===target.z){
              verified=true;e.verifiedSteps++;
              e.lastVerified={x:target.x,z:target.z,tick:actual.tick};
              this.onChange();break;
            }
          }
          if(verified)break;
        }
        if(!verified&&e.phase==='running')throw new Error('no_observed_normal_movement');
        await sleep(800);
      }
    }catch(error){
      if(!signal.aborted){
        e.phase='error';e.error=String(error?.message??error).slice(0,140);
        this.onChange();
      }
    }finally{
      if(e.adapter)try{await e.adapter.close()}catch{}
      if(e.phase==='running'||e.phase==='paused')e.phase='stopped';
      this.onChange();
    }
  }
  async woodcut(e,signal){
    const s=await e.adapter.observe();
    const woodcut=s.skills?.find(skill=>skill.name==='Woodcutting');
    if(!woodcut||!Number.isSafeInteger(woodcut.xpTenths)||!Array.isArray(s.nearbyLocs))
      throw new Error('woodcutting_skill_or_real_map_unavailable');
    const inventory=[...(s.inventory??[]),...(s.equipment??[])];
    if(!Array.isArray(s.inventory)||!Array.isArray(s.equipment)||
       !inventory.some(i=>typeof i.name==='string'&&/\baxe\b/i.test(i.name)))
      throw new Error('real_axe_required_before_chopping');
    const trees=s.nearbyLocs.filter(loc=>typeof loc.name==='string'&&
      /tree/i.test(loc.name)&&Array.isArray(loc.optionsWithIndex)&&
      loc.optionsWithIndex.some(op=>/chop/i.test(op.text)&&
        Number.isInteger(op.opIndex)&&op.opIndex>=1&&op.opIndex<=5)&&
      Math.max(Math.abs(loc.x-s.position.x),Math.abs(loc.z-s.position.z))<=4);
    if(!trees.length)throw new Error('no_observed_choppable_tree_within_four_tiles');
    trees.sort((a,b)=>Math.max(Math.abs(a.x-s.position.x),Math.abs(a.z-s.position.z))-
      Math.max(Math.abs(b.x-s.position.x),Math.abs(b.z-s.position.z)));
    const target=trees[0];
    const optionIndex=target.optionsWithIndex.find(op=>/chop/i.test(op.text)).opIndex;
    if(typeof e.adapter.interactLoc!=='function')
      throw new Error('native_location_action_not_available');
    const dispatch=await e.adapter.interactLoc({
      x:target.x,z:target.z,locId:target.id,optionIndex
    });
    if(!['queued_unverified','dispatched_unverified'].includes(dispatch.status))
      throw new Error('native_chop_packet_not_dispatched');
    for(let i=0;i<16&&!signal.aborted&&e.phase==='running';i++){
      await sleep(700);
      if(signal.aborted||e.phase!=='running')return;
      const after=await e.adapter.observe();
      const current=after.skills?.find(skill=>skill.name==='Woodcutting');
      if(current?.xpTenths>woodcut.xpTenths){
        e.verifiedActivities++;
        e.lastVerified={activity:'Woodcutting',xpGainTenths:current.xpTenths-woodcut.xpTenths,tick:after.tick};
        this.onChange();
        return;
      }
    }
    if(!signal.aborted&&e.phase==='running')
      throw new Error('chop_dispatched_but_no_native_woodcutting_xp_observed');
  }
  async talk(e,signal){
    const s=await e.adapter.observe();
    if(!s.position||!Array.isArray(s.nearbyNpcs))
      throw new Error('native_npcs_unavailable');
    const npc=s.nearbyNpcs.find(n=>Array.isArray(n.optionsWithIndex)&&
      n.optionsWithIndex.some(op=>/^talk/i.test(op.text))&&
      Math.max(Math.abs(n.x-s.position.x),Math.abs(n.z-s.position.z))<=4);
    if(!npc)throw new Error('no_observed_talkable_npc_within_four_tiles');
    if(typeof e.adapter.interactNpc!=='function')
      throw new Error('native_npc_action_not_available');
    const op=npc.optionsWithIndex.find(op=>/^talk/i.test(op.text));
    const dispatch=await e.adapter.interactNpc({npcIndex:npc.index,optionIndex:op.opIndex});
    if(!['queued_unverified','dispatched_unverified'].includes(dispatch.status))
      throw new Error('native_npc_packet_not_dispatched');
    for(let i=0;i<12&&!signal.aborted&&e.phase==='running';i++){
      await sleep(700);
      if(signal.aborted||e.phase!=='running')return;
      const after=await e.adapter.observe();
      if(after.dialogue?.isOpen===true&&after.dialogue?.isWaiting===true){
        e.verifiedActivities++;
        e.lastVerified={activity:'NPC dialogue',npcIndex:npc.index,tick:after.tick};
        e.phase='paused';
        this.onChange();
        return;
      }
    }
    if(!signal.aborted&&e.phase==='running')
      throw new Error('talk_dispatched_but_no_native_dialogue_opened');
  }

}
