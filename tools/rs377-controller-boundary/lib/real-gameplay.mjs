/** Task 36: evidence-only gameplay acceptance; no game writes. */
const fail=m=>{throw new Error(m)};
const valid=s=>s?.provenance?.kind==='authenticated_377_engine'&&s.provenance.synthetic===false&&s.revision===377&&s.tickMs===600&&s.xpMultiplier===1&&Number.isSafeInteger(s.tick)&&Array.isArray(s.inventory)&&Array.isArray(s.bank)&&Array.isArray(s.skills)&&s.questStages&&s.player?.accountId&&s.player?.sessionId?.startsWith('disposable-');
const qty=(items,id)=>items.filter(i=>i.id===id).reduce((n,i)=>n+i.quantity,0);
const xp=(s,name)=>s.skills.find(x=>x.name===name)?.xpTenths;
export const requiredGameplayChecks=Object.freeze(['npc_dialogue','object_interaction','gathering','xp_1x','inventory_change','bank_change','persistent_relogin']);
export function evaluateRealGameplay({before,after,actions,expectation,relogin}={}){
 if(!valid(before)||!valid(after)||!Array.isArray(actions)||!actions.length)fail('authoritative_observations_required');
 const b=before,a=after,p=relogin;
 if(b.provenance.worldFingerprint!==a.provenance.worldFingerprint||b.provenance.sourceCommit!==a.provenance.sourceCommit||b.player.accountId!==a.player.accountId||b.player.sessionId!==a.player.sessionId||a.tick<=b.tick||a.provenance.sequence<=b.provenance.sequence)fail('independent_world_observations_required');
 if(!actions.every(x=>x.transport==='authenticated_native_377_tcp'&&x.synthetic===false&&x.privileged!==true&&x.questStageWrite!==true&&x.sessionId===b.player.sessionId&&x.worldFingerprint===b.provenance.worldFingerprint&&Number.isInteger(x.opcode)&&x.tick>=b.tick&&x.tick<=a.tick&&['dispatched_unverified','queued_unverified'].includes(x.status)))fail('normal_packet_proof_required');
 if(!expectation||!Number.isInteger(expectation.itemId)||!Number.isInteger(expectation.bankItemId)||!Number.isInteger(expectation.xpGainTenths)||expectation.xpGainTenths<=0)fail('explicit_expected_gameplay_required');
 const has=k=>actions.some(x=>x.kind===k);
 const xpOk=xp(a,expectation.skill)-xp(b,expectation.skill)===expectation.xpGainTenths;
 const itemOk=qty(a.inventory,expectation.itemId)>qty(b.inventory,expectation.itemId);
 const checks={
 npc_dialogue:has('npc_option')&&a.dialogue?.source==='engine'&&a.dialogue?.npcId===expectation.npcId&&a.dialogue?.pageId!==b.dialogue?.pageId,
 object_interaction:has('loc_option')&&a.objectEvents?.some(e=>e.source==='engine'&&e.objectId===expectation.objectId&&e.tick>b.tick),
 gathering:has('loc_option')&&itemOk&&xpOk,
 xp_1x:xpOk,
 inventory_change:itemOk,
 bank_change:has('bank_deposit')&&qty(a.bank,expectation.bankItemId)>qty(b.bank,expectation.bankItemId)&&qty(a.inventory,expectation.bankItemId)<qty(b.inventory,expectation.bankItemId),
 persistent_relogin:false
 };
 if(JSON.stringify(a.questStages)!==JSON.stringify(b.questStages))fail('quest_stage_change_not_gameplay_proof');
 if(p){
  if(!valid(p)||p.provenance.worldFingerprint!==a.provenance.worldFingerprint||p.player.accountId!==a.player.accountId||p.player.sessionId===a.player.sessionId||p.provenance.reauthenticated!==true||p.provenance.saveReloadedFromDisk!==true||p.tick<=a.tick||!['inventory','bank','skills','questStages'].every(k=>JSON.stringify(p[k])===JSON.stringify(a[k])))fail('persistent_relogin_not_proven');
  checks.persistent_relogin=true;
 }
 return Object.freeze({outcome:Object.values(checks).every(Boolean)?'pass':'blocked',checks:Object.entries(checks).map(([name,ok])=>({name,outcome:ok?'pass':'blocked'}))});
}
