/** Task 37: strict, redacted, machine-readable evidence validator.
 * No credentials, raw chat, real account names, save paths or private keys.
 */
const allowedKinds=new Set(['source','fedora','disposable377','same_world','gameplay']);
const allowedOutcomes=new Set(['pass','fail','blocked','unverified']);
export function validateEvidence(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('invalid_evidence');
 const keys=['kind','outcome','timestamp','sourceCommit','worldFingerprint','checks'];
 if(Object.keys(raw).some(k=>!keys.includes(k)))throw new Error('unexpected_sensitive_field');
 if(!allowedKinds.has(raw.kind)||!allowedOutcomes.has(raw.outcome))throw new Error('invalid_result');
 if(typeof raw.timestamp!=='string'||!Number.isFinite(Date.parse(raw.timestamp)))throw new Error('invalid_timestamp');
 if(typeof raw.sourceCommit!=='string'||!/^[a-f0-9]{40}$/.test(raw.sourceCommit))throw new Error('invalid_commit');
 if(raw.worldFingerprint!==null&&(!/^[a-f0-9]{64}$/.test(raw.worldFingerprint??'')))throw new Error('invalid_world_fingerprint');
 if(!Array.isArray(raw.checks)||raw.checks.length>50||raw.checks.some(x=>!x||!/^([a-z][a-z0-9_-]{1,50})$/.test(x.name)||!allowedOutcomes.has(x.outcome)||Object.keys(x).some(k=>!['name','outcome'].includes(k))))throw new Error('invalid_checks');
 if(raw.outcome==='pass'&&(!raw.checks.length||raw.checks.some(x=>x.outcome!=='pass')))throw new Error('unsupported_pass');
 if(raw.kind==='same_world'&&raw.outcome==='pass'&&!['two_clients_visible','world_identity_matched'].every(name=>raw.checks.some(x=>x.name===name&&x.outcome==='pass')))throw new Error('missing_same_world_proof');
 if(raw.kind==='gameplay'&&raw.outcome==='pass'&&!['normal_action','observed_effect','persistent_relogin'].every(name=>raw.checks.some(x=>x.name===name&&x.outcome==='pass')))throw new Error('missing_gameplay_proof');
 return Object.freeze({kind:raw.kind,outcome:raw.outcome,timestamp:raw.timestamp,sourceCommit:raw.sourceCommit,worldFingerprint:raw.worldFingerprint,checks:raw.checks.map(x=>({name:x.name,outcome:x.outcome}))});
}
