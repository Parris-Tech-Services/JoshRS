/**
 * Tasks 31 & 33: policy-only companion brain. No network, filesystem, shell,
 * account controls, PM reader, NPC spawning, XP/item grants or teleport.
 * Actions are advisory and must be carried out by a verified #377 adapter.
 */
const MODES = Object.freeze(['stop', 'follow', 'assist', 'gather']);
const bounded = (n,max=16383)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const validName = s=>typeof s==='string'&&/^[A-Za-z0-9_ ]{1,12}$/.test(s);
function sameName(a,b){return a.toLowerCase()===b.toLowerCase();}
function checkSnapshot(snapshot,{botName,allowFamilyWorld}){
  if(!snapshot||typeof snapshot!=='object'||!snapshot.world||!snapshot.player)throw Error('Missing actual #377 world/player observation');
  const {world,player}=snapshot;
  if(world.revision!==377||world.tickMs!==600||world.xpMultiplier!==1)throw Error('World has wrong revision/tick/XP');
  if(world.mode!=='isolated'&&!(allowFamilyWorld&&world.mode==='family'))throw Error('Unapproved world mode');
  if(!/^(?:isolated|family)-[a-zA-Z0-9_-]{4,64}$/.test(world.instanceId??''))throw Error('Unknown world generation');
  if(!player.isBot||!validName(player.username)||!sameName(player.username,botName))throw Error('Wrong bot identity');
  if(!bounded(snapshot.tick,Number.MAX_SAFE_INTEGER)||!bounded(player.x)||!bounded(player.z)||!bounded(player.plane,3))throw Error('Invalid player coordinates/tick');
  if(!Array.isArray(player.inventory)||!player.inventory.every(i=>bounded(i.id,2147483647)&&bounded(i.quantity,2147483647)&&bounded(i.slot,27)))throw Error('Invalid inventory observation');
  if(!player.xp||!Object.values(player.xp).every(n=>bounded(n,Number.MAX_SAFE_INTEGER)))throw Error('Invalid XP');
  return snapshot;
}
export function createCompanion({botName='HarnessTest',ownerName='Elrothiro',axeItemId=null,treeObjectId=null,
  allowFamilyWorld=false,cooldownTicks=2}={}){
  if(!validName(botName)||!validName(ownerName)||sameName(botName,ownerName))throw Error('Separate bot and owner identities required');
  if(!bounded(cooldownTicks,20))throw Error('Invalid cooldown');
  for(const [name,id] of [['axeItemId',axeItemId],['treeObjectId',treeObjectId]])
    if(id!==null&&!bounded(id,2147483647))throw Error('Invalid '+name);
  let mode='stop',lastTick=-1,lastWorld=null;
  return Object.freeze({
    getMode:()=>mode,
    /**
     * Only caller-verified *public in-game chat* from a known owner is admitted;
     * no PMs, shell, free-text task execution, links or LLM-as-admin commands.
     * Transport must authenticate sender; a string alone is not proof.
     */
    acceptChat(message){
      if(!message||message.authenticated!==true||message.channel!=='public'||
        !validName(message.sender)||!sameName(message.sender,ownerName))return {accepted:false,reason:'unauthorised_message'};
      if(typeof message.text!=='string'||message.text.length>48||
        /[^A-Za-z ]/.test(message.text))return {accepted:false,reason:'untrusted_text'};
      const clean=message.text.trim().toLowerCase().replace(/ +/g,' ');
      const commands={'bot follow':'follow','bot assist':'assist','bot gather':'gather','bot stop':'stop'};
      if(!Object.hasOwn(commands,clean))return {accepted:false,reason:'not_a_bounded_mode_command'};
      mode=commands[clean];
      return {accepted:true,mode};
    },
    setMode(next,{authenticated=false}={}){
      if(authenticated!==true||!MODES.includes(next))return {accepted:false,reason:'invalid_or_unauthorised_mode'};
      mode=next;return {accepted:true,mode};
    },
    next(snapshot){
      const s=checkSnapshot(snapshot,{botName,allowFamilyWorld});
      if(lastWorld!==null&&s.world.instanceId!==lastWorld)throw Error('World generation changed; controller lease must be renewed');
      lastWorld=s.world.instanceId;
      if(s.tick<lastTick)throw Error('World tick regressed');
      if(mode==='stop')return {status:'stopped',action:null,reason:'no_actions_after_stop'};
      if(lastTick>=0&&s.tick-lastTick<cooldownTicks)return {status:'idle',action:null,reason:'cooldown'};
      if(mode==='follow'||mode==='assist'){
        const owner=(s.nearbyPlayers??[]).find(p=>validName(p.username)&&sameName(p.username,ownerName)&&p.online===true);
        if(!owner||!bounded(owner.x)||!bounded(owner.z)||owner.plane!==s.player.plane)
          return {status:'blocked',action:null,reason:'owner_not_visible_on_same_plane'};
        const dx=owner.x-s.player.x,dz=owner.z-s.player.z;
        if(Math.abs(dx)+Math.abs(dz)>28)return {status:'blocked',action:null,reason:'owner_not_reachable_without_path_verification'};
        if(Math.max(Math.abs(dx),Math.abs(dz))<=2)return {status:'idle',action:null,reason:mode==='assist'?'assisting_near_owner':'within_follow_distance'};
        const x=s.player.x+Math.sign(dx)*Math.min(Math.abs(dx),4);
        const z=s.player.z+Math.sign(dz)*Math.min(Math.abs(dz),4);
        lastTick=s.tick;
        return {status:'planned',action:{type:'walk',x,z},requires:'server_observed_position_change',mode};
      }
      if(!bounded(axeItemId??-1,2147483647)||!bounded(treeObjectId??-1,2147483647))
        return {status:'blocked',action:null,reason:'requires_verified_source_item_and_object_ids'};
      if(!s.player.inventory.some(i=>i.id===axeItemId&&i.quantity>=1))
        return {status:'blocked',action:null,reason:'axe_must_be_obtained_legitimately'};
      const trees=(s.nearbyLocs??[]).filter(o=>o&&o.id===treeObjectId&&bounded(o.x)&&bounded(o.z)&&o.plane===s.player.plane);
      const tree=trees.find(o=>Array.isArray(o.options)&&o.options.some(t=>/^chop(?: down)?$/i.test(t)));
      if(!tree)return {status:'blocked',action:null,reason:'no_verified_choppable_tree'};
      if(Math.abs(tree.x-s.player.x)+Math.abs(tree.z-s.player.z)>15)return {status:'blocked',action:null,reason:'tree_too_distant'};
      lastTick=s.tick;
      return {status:'planned',action:{type:'loc_option',x:tree.x,z:tree.z,locId:tree.id,option:1},
        requires:'observed_log_and_normal_xp_change',mode};
    }
  });
}
export {MODES};
