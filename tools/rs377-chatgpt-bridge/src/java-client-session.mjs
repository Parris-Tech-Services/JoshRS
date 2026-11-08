/**
 * One-session rev377 native Java client transport for original upstream SDK.
 * The separate Session377 TCP bot may not login simultaneously with the
 * Java client using the same username. Reuse the real authenticated Java
 * game's ordinary ISAAC channel instead.
 */
export async function createJavaClient377Session(clientControl){
 if(!clientControl||typeof clientControl.status!=='function'||
    typeof clientControl.sendPacket!=='function')
  throw new Error('opt_in_java_client_control_required');
 const initial=await clientControl.status();
 if(!Number.isSafeInteger(initial.clientCycle)||initial.clientCycle<0)
  throw new Error('native_java_client_auth_not_observed');
 let lastVerifiedAt=Date.now(),lastCycle=initial.clientCycle;
 let closed=false;
 return Object.freeze({
  async refresh(){
   if(closed)throw new Error('java_game_session_closed');
   const observed=await clientControl.status();
   if(observed.clientCycle<lastCycle)throw new Error('native_java_client_tick_regressed');
   lastCycle=observed.clientCycle;lastVerifiedAt=Date.now();
  },
  status:()=>Object.freeze({
    authenticated:!closed&&Date.now()-lastVerifiedAt<5000,
    transport:'real_java_377_isolated_client',
    source:'client_status_observed_not_second_login'
  }),
  async sendPacket(packet){
   if(closed)throw new Error('native_java_client_session_closed');
   const current=await clientControl.status();
   if(current.clientCycle<lastCycle)throw new Error('native_java_client_tick_regressed');
   lastCycle=current.clientCycle;lastVerifiedAt=Date.now();
   const sent=await clientControl.sendPacket(packet);
   if(sent.status!=='queued_unverified')
    throw new Error('native_java_packet_not_queued');
   return Object.freeze({...sent,verifiedEffect:false});
  },
  async disconnect(){closed=true}
 });
}
