import {mkdir,readFile,writeFile,rename,lstat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
const uncertain=new Set(['ground_take','inventory_option','item_on_loc','loc_option','npc_option','dialog_option']);
export function backoff(attempt,{baseMs=250,maxMs=8000,maxRetries=5}={}){
  if(!Number.isInteger(attempt)||attempt<0||attempt>=maxRetries)return null;
  return Math.min(maxMs,baseMs*2**Math.min(attempt,20));
}
/** Crash-safe ledger: no credential data, and no uncertain action replays. */
export class ReplayLedger{
  constructor(file){if(typeof file!=='string'||!path.isAbsolute(file))throw new Error('absolute_journal_path_required');this.file=file;this.entries=new Map();this.sessionId=null;this.stopped=true;}
  async load(){
    try{const stat=await lstat(this.file);if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077))throw new Error('unsafe_journal_permissions');
      const data=JSON.parse(await readFile(this.file,'utf8'));
      if(data.version!==1||!Array.isArray(data.entries)||data.entries.length>1000)throw new Error('invalid_journal');
      this.entries=new Map(data.entries.map(e=>{if(!e||typeof e.id!=='string'||!['reserved','sent','observed','rejected','unverified','timeout','cancelled'].includes(e.status)||typeof e.type!=='string')throw new Error('invalid_journal');return [e.id,e]}));
    }catch(e){if(e.code!=='ENOENT')throw e;}
    // On restart, an operation reserved before crash is UNKNOWN, never retried.
    let dirty=false;
    for(const e of this.entries.values())if(e.status==='reserved'||e.status==='sent'){e.status='unverified';dirty=true;}
    if(dirty)await this.persist();
    return this;
  }
  async persist(){
    await mkdir(path.dirname(this.file),{recursive:true,mode:0o700});
    try{const s=await lstat(this.file);if(s.isSymbolicLink()||!s.isFile())throw new Error('unsafe_journal_target');}catch(e){if(e.code!=='ENOENT')throw e;}
    const tmp=`${this.file}.${randomUUID()}.tmp`;
    try{await writeFile(tmp,JSON.stringify({version:1,entries:[...this.entries.values()]})+'\n',{mode:0o600,flag:'wx'});await rename(tmp,this.file);}catch(e){const {rm}=await import('node:fs/promises');await rm(tmp,{force:true});throw e;}
  }
  openSession(id){if(typeof id!=='string'||!id||this.sessionId)throw new Error('duplicate_session');this.sessionId=id;this.stopped=false;}
  closeSession(id){if(this.sessionId!==id)throw new Error('wrong_session');this.sessionId=null;this.stopped=true;}
  async reserve(id,act){
    if(this.stopped||!this.sessionId)throw new Error('not_connected');
    if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(id))throw new Error('invalid_action_id');
    if(this.entries.has(id))throw new Error('replay_denied');
    if(this.entries.size>=1000)throw new Error('journal_full_reconcile_manually');
    this.entries.set(id,{id,type:act.type,status:'reserved',replaySafe:!uncertain.has(act.type)});await this.persist();
  }
  async finish(id,status){const e=this.entries.get(id);if(!e)throw new Error('unreserved_action');if(!['sent','observed','rejected','unverified','timeout','cancelled'].includes(status))throw new Error('invalid_result');e.status=status;await this.persist();}
  /** Explicit operator verification required for a new action ID after ambiguity. */
  get(id){return this.entries.get(id)?{...this.entries.get(id)}:null;}
}

/** Explicit, bounded reconnection coordinator; never retries gameplay actions. */
export class BoundedReconnect{
  constructor({maxRetries=5,baseMs=250,maxMs=8000,sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
    if(!Number.isInteger(maxRetries)||maxRetries<1||maxRetries>10||!Number.isInteger(baseMs)||baseMs<1||!Number.isInteger(maxMs)||maxMs<baseMs)throw new Error('invalid_recovery_limits');
    this.options={maxRetries,baseMs,maxMs};this.sleep=sleep;this.active=false;this.connected=false;this.attempts=0;
  }
  async reconnect(connect,{signal}={}){
    if(this.active||this.connected)throw new Error('duplicate_connection');
    if(typeof connect!=='function')throw new Error('missing_connect_callback');
    this.active=true;
    try{
      for(let attempt=0;attempt<this.options.maxRetries;attempt++){
        if(signal?.aborted)return {status:'cancelled',attempts:attempt};
        try{
          const session=await connect({attempt,signal});
          if(signal?.aborted){await session?.close?.();return {status:'cancelled',attempts:attempt+1};}
          if(!session || typeof session.close!=='function')throw new Error('invalid_connection');
          this.connected=true;this.session=session;this.attempts=attempt+1;
          return {status:'connected',attempts:this.attempts};
        }catch(e){
          if(e.code==='AUTH_FAILED'||e.code==='WRONG_WORLD')return {status:'blocked',reason:e.code,attempts:attempt+1};
          if(attempt+1===this.options.maxRetries)return {status:'exhausted',attempts:attempt+1};
          const ms=backoff(attempt,this.options);
          await this.sleep(ms);
        }
      }
    }finally{this.active=false;}
  }
  async close(){if(this.session)await this.session.close();this.session=null;this.connected=false;}
}
