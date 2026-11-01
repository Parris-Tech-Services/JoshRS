import {choices,date,hash,kinds,reject,shape} from './capture-schema.mjs';
export function checkMetadata(x){
 shape(x,['schemaVersion','kind','evidenceOrigin','host','world','identities','startedAt','endedAt','observedActions','rawTestOutcome','assertions'],'capture');
 if(x.schemaVersion!==1||!kinds.has(x.kind)||!choices('fixture operator-capture').has(x.evidenceOrigin))reject('invalid_header');
 const operator=x.evidenceOrigin==='operator-capture';
 shape(x.host,['category','identityHmacSha256','sourceCommit','sourceSha256'],'host');
 if(!choices('fedora-controller windows-engine ci-runner other').has(x.host.category))reject('invalid_host_category');
 hash(x.host.identityHmacSha256,64,'host_hmac',operator);
 hash(x.host.sourceCommit,40,'source_commit',operator);
 hash(x.host.sourceSha256,64,'source_hash',operator);
 shape(x.world,['mode','identityHmacSha256','revision','tickMs','xpMultiplier'],'world');
 if(!choices('isolated family unknown').has(x.world.mode))reject('invalid_world_mode');
 hash(x.world.identityHmacSha256,64,'world_hmac',operator);
 if(x.world.revision!==377||x.world.tickMs!==600||x.world.xpMultiplier!==1)reject('invalid_world_contract');
 shape(x.identities,['bot','player'],'identities');
 for(const v of Object.values(x.identities))if(!choices('none disposable family unknown').has(v))reject('invalid_identity_category');
 const start=date(x.startedAt),end=date(x.endedAt);
 if(end<start||end-start>72*60*60*1000)reject('invalid_time_window');
 return {start,end};
}
