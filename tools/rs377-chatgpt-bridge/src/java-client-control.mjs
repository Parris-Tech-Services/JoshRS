/**
 * Opt-in local companion for the REAL LostCityRS Client-Java revision 377.
 *
 * This is not an engine cheat or a GUI simulation. The patched Java client
 * executes the exact existing tab/design code on its own game loop. Loopback
 * with an ephemeral token, non-family port, Harness identity and isolated
 * world are mandatory. A queued design packet is NEVER reported as success.
 */
import net from 'node:net';

const validBot = b=>typeof b==='string'&&/^Harness[A-Za-z0-9_-]{1,10}$/.test(b);
const validWorld=w=>typeof w==='string'&&/^isolated-[A-Za-z0-9_-]{4,64}$/.test(w);
const validPort=p=>Number.isSafeInteger(p)&&p>=1024&&p<=65535&&
  ![52402,8888,15402,18880,18881,18883].includes(p);
const forbidden=/[\r\n\t|]/;
function parseStatus(response){
 const m=/^OK\|status\|(0|[1-9]|1[0-3])\|([01])\|([01])\|([0-9]{1,10})\|([0-9]{1,12})$/.exec(response);
 if(!m)throw new Error('real_java_client_status_unavailable');
 return Object.freeze({tab:Number(m[1]),designOpen:m[2]==='1',
  gender:Number(m[3]),appearanceHash:Number(m[4]),clientCycle:Number(m[5])});
}
async function exchange({port,token},action,arg,body=null){
 if(!['status','setTab','randomizeCharacterDesign','acceptCharacterDesign','nativePacket'].includes(action)||
    !Number.isSafeInteger(arg)||arg<0||arg>(action==='nativePacket'?255:13))
  throw new Error('isolated_client_control_invalid_action');
 if(body!==null&&action!=='nativePacket')
  throw new Error('unexpected_native_payload');
 if(action==='nativePacket'&&(!Buffer.isBuffer(body)||body.length>100||
    (body.length<1&&arg!==110)))
  throw new Error('normal_game_packet_body_required');
 const line=token+'\t'+action+'\t'+arg+
   (body===null?'':'\t'+body.toString('base64'))+'\n';
 if(Buffer.byteLength(line)>300)throw new Error('client_control_request_too_large');
 return new Promise((resolve,reject)=>{
  const socket=net.createConnection({host:'127.0.0.1',port});
  let text='',settled=false;
  const finish=(error,value)=>{
   if(settled)return;settled=true;socket.destroy();
   if(error)reject(error);else resolve(value);
  };
  socket.setTimeout(4500,()=>finish(new Error('java_client_control_timeout')));
  socket.on('connect',()=>socket.write(line,'ascii'));
  socket.on('data',chunk=>{
   text+=chunk.toString('ascii');
   if(text.length>300)return finish(new Error('java_client_control_response_too_large'));
   if(text.includes('\n')){
    const response=text.slice(0,text.indexOf('\n')).trim();
    if(!response.startsWith('OK|'))
     return finish(new Error('java_client_control_refused_'+response.replace(/[^a-zA-Z0-9_|]/g,'').slice(0,70)));
    finish(null,response);
   }
  });
  socket.on('error',e=>finish(new Error('java_client_control_socket_unavailable_'+e.code)));
  socket.on('close',()=>{if(!settled)finish(new Error('java_client_control_closed_without_ack'))});
 });
}

export function createNativeClient377Control({port,token,botName,worldId}={}){
 if(!validPort(port)||!validBot(botName)||!validWorld(worldId)||
    typeof token!=='string'||token.length<32||token.length>128||
    !/^[A-Za-z0-9_-]+$/.test(token))
  throw new Error('isolated_native_client_identity_and_ephemeral_token_required');
 const config=Object.freeze({port,token});
 let active=false;
 return Object.freeze({
  async status(){
   return parseStatus(await exchange(config,'status',0));
  },
  async sendPacket(packet){
   if(active)throw new Error('concurrent_native_java_client_action_denied');
   if(!packet||!Number.isSafeInteger(packet.opcode)||
      !Buffer.isBuffer(packet.body))
    throw new Error('verified_377_packet_required');
   active=true;
   try{
    const ack=await exchange(config,'nativePacket',packet.opcode,packet.body);
    if(!new RegExp('^OK\\|native_packet_queued_unverified\\|'+packet.opcode+'\\|[0-9]+
   if(active)throw new Error('concurrent_native_java_client_action_denied');
   active=true;
   try{
    if(!action||typeof action!=='object'||
       !['setTab','randomizeCharacterDesign','acceptCharacterDesign'].includes(action.type))
      throw new Error('unsupported_local_java_client_action');
    const before=parseStatus(await exchange(config,'status',0));
    if(action.type==='setTab'){
     if(!Number.isInteger(action.tabIndex)||action.tabIndex<0||action.tabIndex>13)
      throw new Error('unavailable_native_client_tab');
     const ack=await exchange(config,'setTab',action.tabIndex);
     if(!new RegExp('^OK\\|tab\\|'+action.tabIndex+'\\|[0-9]+$').test(ack))
      throw new Error('unverified_native_tab_ack');
     const after=parseStatus(await exchange(config,'status',0));
     if(after.tab!==action.tabIndex||after.clientCycle<=before.clientCycle)
      throw new Error('native_client_tab_change_not_observed');
     return Object.freeze({status:'client_effect_observed',effect:'tab',
       verifiedEffect:true,tabIndex:after.tab,clientCycle:after.clientCycle});
    }
    if(!before.designOpen)throw new Error('native_player_kit_interface_not_open');
    if(action.type==='randomizeCharacterDesign'){
     const ack=await exchange(config,'randomizeCharacterDesign',0);
     if(!/^OK\|randomized\|[0-9]+\|OK\|status\|/.test(ack))
      throw new Error('native_randomize_not_acknowledged');
     const after=parseStatus(await exchange(config,'status',0));
     if(!after.designOpen||after.clientCycle<=before.clientCycle||
        (after.appearanceHash===before.appearanceHash&&after.gender===before.gender))
       throw new Error('native_character_design_not_changed');
     return Object.freeze({status:'client_effect_observed',effect:'randomize',
       verifiedEffect:true,clientCycle:after.clientCycle});
    }
    const ack=await exchange(config,'acceptCharacterDesign',0);
    if(!/^OK\|design_packet_queued_unverified\|[0-9]+$/.test(ack))
     throw new Error('native_design_packet_not_acknowledged');
    // Java client reporting packet queued is not proof it was processed by
    // the rev377 game. SDK gateway must observe server-side appearance delta.
    return Object.freeze({status:'client_packet_dispatched_unverified',
      verifiedEffect:false,effect:'accept_design',clientCycle:before.clientCycle});
   }finally{active=false}
  }
 });
}
).test(ack))
     throw new Error('native_java_game_packet_not_queued');
    return Object.freeze({status:'queued_unverified',opcode:packet.opcode,
      verifiedEffect:false,transport:'real_java_client_377'});
   }finally{active=false}
  },
  async perform(action){
   if(active)throw new Error('concurrent_native_java_client_action_denied');
   active=true;
   try{
    if(!action||typeof action!=='object'||
       !['setTab','randomizeCharacterDesign','acceptCharacterDesign'].includes(action.type))
      throw new Error('unsupported_local_java_client_action');
    const before=await parseStatus(await exchange(config,'status',0));
    if(action.type==='setTab'){
     if(!Number.isInteger(action.tabIndex)||action.tabIndex<0||action.tabIndex>13)
      throw new Error('unavailable_native_client_tab');
     const ack=await exchange(config,'setTab',action.tabIndex);
     if(!new RegExp('^OK\\|tab\\|'+action.tabIndex+'\\|[0-9]+$').test(ack))
      throw new Error('unverified_native_tab_ack');
     const after=parseStatus(await exchange(config,'status',0));
     if(after.tab!==action.tabIndex||after.clientCycle<=before.clientCycle)
      throw new Error('native_client_tab_change_not_observed');
     return Object.freeze({status:'client_effect_observed',effect:'tab',
       verifiedEffect:true,tabIndex:after.tab,clientCycle:after.clientCycle});
    }
    if(!before.designOpen)throw new Error('native_player_kit_interface_not_open');
    if(action.type==='randomizeCharacterDesign'){
     const ack=await exchange(config,'randomizeCharacterDesign',0);
     if(!/^OK\|randomized\|[0-9]+\|OK\|status\|/.test(ack))
      throw new Error('native_randomize_not_acknowledged');
     const after=parseStatus(await exchange(config,'status',0));
     if(!after.designOpen||after.clientCycle<=before.clientCycle||
        (after.appearanceHash===before.appearanceHash&&after.gender===before.gender))
       throw new Error('native_character_design_not_changed');
     return Object.freeze({status:'client_effect_observed',effect:'randomize',
       verifiedEffect:true,clientCycle:after.clientCycle});
    }
    const ack=await exchange(config,'acceptCharacterDesign',0);
    if(!/^OK\|design_packet_queued_unverified\|[0-9]+$/.test(ack))
     throw new Error('native_design_packet_not_acknowledged');
    // Java client reporting packet queued is not proof it was processed by
    // the rev377 game. SDK gateway must observe server-side appearance delta.
    return Object.freeze({status:'client_packet_dispatched_unverified',
      verifiedEffect:false,effect:'accept_design',clientCycle:before.clientCycle});
   }finally{active=false}
  }
 });
}
