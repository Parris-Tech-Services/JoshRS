/**
 * Task 35: assertions over TWO distinct Java-client observation timelines,
 * not over the server's self-reported bot list or TCP write acknowledgements.
 * The payload is a *capture contract*, NOT cryptographic proof of provenance.
 * Real capture must be taken independently from two real Java clients.
 */
const validName=x=>typeof x==='string'&&/^[A-Za-z0-9_ ]{1,12}$/.test(x);
const itemKey=items=>JSON.stringify([...items].sort((a,b)=>a.id-b.id));
function validEvent(e){
  return e&&e.source==='java-client-377'&&
    ['client_login','players_visible','player_moved','friend_status','follow_observed',
      'public_chat','client_logout','client_relogin','bot_save_state'].includes(e.type)&&
    Number.isSafeInteger(e.tick)&&e.tick>=0&&typeof e.sessionId==='string'&&
    typeof e.worldId==='string'&&validName(e.observer)&&typeof e.captureId==='string';
}
export function checkTwoClientAcceptance({events,bot='HarnessTest',owner='Elrothiro',
  evidenceOrigin='fixture',worldId=null}={}){
  const missing=[],fail=msg=>{if(!missing.includes(msg))missing.push(msg);};
  if(!Array.isArray(events)||!validName(bot)||!validName(owner)||bot.toLowerCase()===owner.toLowerCase())
    throw Error('Two distinct character identities and event list required');
  const real=evidenceOrigin==='real-client-capture';
  const all=events.filter(validEvent);
  if(all.length!==events.length)fail('invalid_or_server_only_event');
  const a=all.filter(e=>e.observer===owner),b=all.filter(e=>e.observer===bot);
  if(!a.length||!b.length)fail('two_distinct_real_client_timelines');
  const sessionA=new Set(a.map(x=>x.sessionId)),sessionB=new Set(b.map(x=>x.sessionId));
  if([...sessionA].some(id=>sessionB.has(id)))fail('client_sessions_not_independent');
  if(worldId===null)worldId=a[0]?.worldId??null;
  if(!worldId||[...a,...b].some(e=>e.worldId!==worldId))fail('different_or_unknown_worlds');
  const has=(rows,type,fn=()=>true)=>rows.some(e=>e.type===type&&fn(e));
  if(!has(a,'client_login')||!has(b,'client_login'))fail('both_java_clients_logged_in');
  if(!has(a,'players_visible',e=>e.players?.includes(bot))||
    !has(b,'players_visible',e=>e.players?.includes(owner)))fail('reciprocal_in_client_visibility');
  const movement=a.filter(e=>e.type==='player_moved'&&e.player===bot&&
    Number.isSafeInteger(e.x)&&Number.isSafeInteger(e.z)).sort((x,y)=>x.tick-y.tick);
  if(movement.length<2||!movement.some((e,i)=>i>0&&e.tick>movement[0].tick&&
    (e.x!==movement[0].x||e.z!==movement[0].z)))fail('bot_movement_seen_by_owner_client');
  if(!has(a,'friend_status',e=>e.player===bot&&e.online===true))fail('friend_online_seen_by_owner');
  if(!has(a,'friend_status',e=>e.player===bot&&e.online===false))fail('friend_offline_seen_by_owner');
  if(!has(a,'follow_observed',e=>e.follower===bot&&e.target===owner&&e.pathMovementObserved===true))
    fail('follow_from_two_client_world_state');
  const sent=b.find(e=>e.type==='public_chat'&&e.sender===bot&&e.textId);
  if(!sent||!has(a,'public_chat',e=>e.sender===bot&&e.textId===sent.textId&&e.tick>=sent.tick))
    fail('bot_chat_seen_by_other_java_client');
  const logout=b.find(e=>e.type==='client_logout');
  const relog=b.find(e=>e.type==='client_relogin'&&logout&&e.tick>logout.tick);
  if(!logout||!relog)fail('bot_logout_relogin');
  const saved=b.find(e=>e.type==='bot_save_state'&&e.tick<=logout?.tick&&
    Array.isArray(e.inventory)&&e.xp&&typeof e.xp==='object');
  const restored=b.find(e=>e.type==='bot_save_state'&&relog&&e.tick>=relog.tick&&
    Array.isArray(e.inventory)&&e.xp&&typeof e.xp==='object');
  if(!saved||!restored||itemKey(saved.inventory)!==itemKey(restored.inventory)||
    JSON.stringify(saved.xp)!==JSON.stringify(restored.xp))fail('inventory_xp_persist_after_relogin');
  if(events.some(e=>e?.claims?.includes?.('admin_grant')||e?.source==='mock_server'))
    fail('unauthorised_or_mock_evidence');
  if(!real)fail('not_an_independently_reviewed_real_client_capture');
  return {
    status:missing.length?'blocked':'capture_assertions_passed_pending_independent_review',
    missing,
    evidenceOrigin,worldId,
    clients:sessionA.size+sessionB.size,
    counts:{events:events.length,javaClientEvents:all.length},
    note:'A JSON capture is not cryptographic attestation. Require source logs/screenshots from both actual Java clients before declaring live VERIFIED.'
  };
}
export function sourceAnchors(){
  return Object.freeze({
    javaLogin:'LostCityRS/Client-Java@327880f6de74b40c420705bc42e4b34284885087:src/main/java/jagex2/client/Client.java#L2676-L2730',
    movement:'LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb:src/network/game/client/handler/MoveClickHandler.ts#L11-L56',
    friends:'LostCityRS/Engine-TS@b5ac859b47915afb545e60e4c1208f25d43cb3fb:src/network/game/client/ClientGameProt.ts#L81-L95',
    localBot:'Parris-Tech-Services/JoshRS:tools/rs377-bot-bench/fred-george-family-client.mjs'
  });
}
