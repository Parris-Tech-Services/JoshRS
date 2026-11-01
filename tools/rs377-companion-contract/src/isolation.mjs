/**
 * Task 34: a disposable #377 integration entrypoint. Creates separate test
 * directories, records port/account guardrails, never launches a real world or
 * registers a human account without the caller providing an audited adapter.
 */
import os from 'node:os';
import path from 'node:path';
import {mkdtemp,mkdir,writeFile,readFile,realpath,stat} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';

export const PRODUCTION_PORTS=Object.freeze([52402,8888,45099,43500,43501]);
export const DEFAULT_TEST_PORTS=Object.freeze({game:53402,web:8988,login:53500,friends:55099,logger:53501});
function allowedPorts(ports){
  if(!ports||typeof ports!=='object'||Object.keys(ports).sort().join(',')!==
    Object.keys(DEFAULT_TEST_PORTS).sort().join(','))throw Error('All five explicit isolated service ports required');
  const values=Object.values(ports);
  if(values.some(v=>!Number.isSafeInteger(v)||v<1024||v>65535||PRODUCTION_PORTS.includes(v))||
    new Set(values).size!==values.length)throw Error('Production/conflicting/nonunique ports forbidden');
}
function subpath(root,child){return child.startsWith(root+path.sep);}
export function verifyIsolationManifest(m,{rootHint=null}={}){
  if(!m||m.schema!==1||m.profile!=='disposable-377'||m.mode!=='isolated'||
    m.revision!==377||m.tickMs!==600||m.xpMultiplier!==1||
    m.host!=='127.0.0.1'||m.account!=='HarnessTest'||
    !/^isolated-[a-z0-9]{12}$/.test(m.worldId??''))throw Error('Unsafe or nonisolated manifest');
  allowedPorts(m.ports);
  if(typeof m.root!=='string'||!path.isAbsolute(m.root))
    throw Error('Unexpected disposable test root');
  const root=path.resolve(m.root);
  // A convincing folder name inside a user's *real* JoshRS source/runtime is
  // not isolation. Only one freshly generated child of OS tmpdir is permitted.
  if(path.dirname(root)!==path.resolve(os.tmpdir())||
    !/^joshrs-377-disposable-[A-Za-z0-9_-]{6,}$/.test(path.basename(root)))
    throw Error('Disposable root must be a direct child of OS temporary directory');
  if(rootHint&&root!==path.resolve(rootHint))throw Error('Manifest root mismatch');
  if(!['saves','db','reports','cache'].every(n=>m.paths?.[n]===path.join(root,n)))
    throw Error('Manifest paths must be dedicated test directories');
  if(!subpath(root,m.paths.saves)||!subpath(root,m.paths.db)||!subpath(root,m.paths.reports)||
    !subpath(root,m.paths.cache))throw Error('Unsafe path escape');
  if(Object.keys(m).some(k=>/password|token|private|secret/i.test(k)))throw Error('No secrets allowed in manifest');
  return Object.freeze(m);
}
export async function prepareDisposable({rootBase=os.tmpdir(),ports=DEFAULT_TEST_PORTS}={}){
  allowedPorts(ports);
  const base=await realpath(rootBase),tmp=await realpath(os.tmpdir());
  if(base!==tmp)throw Error('Disposable root must be OS temporary directory');
  const root=await mkdtemp(path.join(base,'joshrs-377-disposable-'));
  const dirs=Object.fromEntries(['saves','db','reports','cache'].map(n=>[n,path.join(root,n)]));
  for(const d of Object.values(dirs))await mkdir(d,{mode:0o700});
  const worldId='isolated-'+randomBytes(6).toString('hex');
  const manifest=verifyIsolationManifest({
    schema:1,profile:'disposable-377',mode:'isolated',
    revision:377,tickMs:600,xpMultiplier:1,worldId,host:'127.0.0.1',
    ports:{...ports},account:'HarnessTest',root,paths:dirs,
    note:'No server or account started. An authorised native adapter must demonstrate actual operation.'
  });
  const filename=path.join(root,'manifest.json');
  await writeFile(filename,JSON.stringify(manifest,null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
  return {manifest,filename};
}
export async function loadVerifiedManifest(filename){
  const target=await realpath(filename);
  const m=JSON.parse(await readFile(target,'utf8'));
  verifyIsolationManifest(m,{rootHint:path.dirname(target)});
  // Parent and child dirs must be actual directories, not symlink redirects.
  const realRoot=await realpath(m.root);
  if(realRoot!==m.root)throw Error('Disposable root symlink forbidden');
  for(const [name,p] of Object.entries(m.paths)){
    const st=await stat(p);
    if(!st.isDirectory()||await realpath(p)!==p)throw Error('Unsafe '+name+' path');
  }
  return m;
}
/**
 * The Agy-provided real adapter MUST implement read-only
 * getWorldIdentity()/observeBot()/observeClient() and bounded dispatch().
 * No real adapter is shipped here; the offline fake is always labelled.
 */
async function boundedOperation(operation,timeoutMs){
  let timer;
  try{
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Isolated #377 adapter timed out')),timeoutMs);})
    ]);
  }finally{clearTimeout(timer);}
}
export async function runIsolatedIntegration({manifest,adapter,timeoutMs=3000}={}){
  verifyIsolationManifest(manifest);
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>10000)throw Error('Invalid adapter timeout');
  if(!adapter||typeof adapter.getWorldIdentity!=='function'||
    typeof adapter.observeBot!=='function'||typeof adapter.dispatch!=='function')
    throw Error('Actual isolated 377 adapter required; fixture cannot certify live gameplay');
  const id=await boundedOperation(()=>adapter.getWorldIdentity(),timeoutMs);
  if(id?.worldId!==manifest.worldId||id?.revision!==377||id?.mode!=='isolated'||
    id?.tickMs!==600||id?.xpMultiplier!==1||id?.host!=='127.0.0.1'||
    id?.gamePort!==manifest.ports.game||id?.account!==manifest.account)
    throw Error('Actual world identity/config differs from disposable manifest');
  const before=await boundedOperation(()=>adapter.observeBot(),timeoutMs);
  if(before?.player?.username!==manifest.account||!Number.isSafeInteger(before.tick))
    throw Error('Missing fresh normal bot observation');
  // No automatic login/registration or mutation. The real adapter is
  // authorised by Agy in its own worktree before test dispatch.
  return {status:'connected_read_only',worldId:id.worldId,account:manifest.account,tick:before.tick,
    note:'Not gameplay pass. Movement/XP/quest acceptance require observed real client evidence.'};
}
