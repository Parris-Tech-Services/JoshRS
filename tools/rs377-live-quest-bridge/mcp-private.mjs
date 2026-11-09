/**
 * Fedora user-owned, PRIVATE HarnessView1-only MCP credentials.
 * NEVER include real secrets in a git file, command argument, env variable,
 * shell history, log line or MCP tool response.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export const BOT='HarnessView1';
export const WORLD='family-joshrs-377';
export const PIN='db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
export const SDK_DIR=path.join(os.homedir(),'.local/share/joshrs','rs-sdk-'+PIN);
export const ROOT=path.join(os.homedir(),'dev/JoshRS/lostcity377');
export const SECRETS=path.join(os.homedir(),'.config/joshrs/family-quest-mcp.json');
const fail=(message)=>{throw new Error(message)};
export function verifyApproval(env=process.env){
 if(env.JOSHRS_FAMILY_SDK_APPROVED!==BOT)fail('explicit_HarnessView1_authorisation_required');
}
export function validateSecrets(obj) {
 if(!obj||typeof obj!=='object'||Array.isArray(obj)||
    Object.keys(obj).sort().join(',')!=='botPassword,observerToken')
  fail('invalid_private_MCP_credential_format');
 if(typeof obj.botPassword!=='string'||!/^[\x21-\x7e]{1,20}$/.test(obj.botPassword))
  fail('invalid_bot_password');
 if(typeof obj.observerToken!=='string'||Buffer.byteLength(obj.observerToken)<32||
    Buffer.byteLength(obj.observerToken)>512||/[\r\n]/.test(obj.observerToken))
  fail('invalid_private_observer_token');
 return Object.freeze({botPassword:obj.botPassword,observerToken:obj.observerToken});
}
export function ensureRegularUser() {
 if(typeof process.getuid!=='function'||process.getuid()===0)
  fail('MCP_must_run_as_normal_Fedora_user');
}
export function readSecrets(secretPath=SECRETS) {
 ensureRegularUser();
 const folder=path.dirname(secretPath);
 const stat=fs.lstatSync(folder);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077)!==0||stat.uid!==process.getuid())
  fail('MCP_credential_directory_must_be_private_0700');
 const file=fs.lstatSync(secretPath);
 if(!file.isFile()||file.isSymbolicLink()||(file.mode&0o077)!==0||
    file.uid!==process.getuid()||file.size>4096)
  fail('MCP_credential_file_must_be_private_0600');
 const data=fs.readFileSync(secretPath,'utf8');
 return validateSecrets(JSON.parse(data));
}
async function hidden(label) {
 if(!process.stdin.isTTY||!process.stderr.isTTY)fail('private_interactive_Fedora_terminal_required');
 process.stderr.write(label);
 if(spawnSync('stty',['-echo'],{stdio:['inherit','ignore','ignore']}).status!==0)
  fail('terminal_echo_control_failed');
 try{
  return await new Promise((resolve,reject)=>{
   let value='';
   const onData=chunk=>{
    value+=chunk.toString('utf8');
    const index=value.indexOf('\n');
    if(index>=0){
     process.stdin.off('data',onData);process.stdin.pause();
     resolve(value.slice(0,index).replace(/\r$/,''));
    } else if(value.length>1024) {
     process.stdin.off('data',onData);process.stdin.pause();
     reject(new Error('credential_input_too_long'));
    }
   };
   process.stdin.resume();process.stdin.on('data',onData);
  });
 }finally{
  spawnSync('stty',['echo'],{stdio:['inherit','ignore','ignore']});
  process.stderr.write('\n');
 }
}
export async function initPrivateSecrets(secretPath=SECRETS) {
 ensureRegularUser();
 verifyApproval();
 const dir=path.dirname(secretPath);
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const st=fs.lstatSync(dir);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077)!==0||
    st.uid!==process.getuid())fail('unsafe_MCP_config_directory');
 // Do NOT replace a file that already exists. This is a create-once
 // configuration; deliberate rotation requires an explicit separate operation.
 if(fs.existsSync(secretPath))fail('MCP_credentials_already_configured_no_overwrite');
 const observerToken=await hidden('Private observer bearer token (hidden): ');
 const botPassword=await hidden('HarnessView1 GAME password (hidden): ');
 const credentials=validateSecrets({botPassword,observerToken});
 const fd=fs.openSync(secretPath,'wx',0o600);
 try {fs.writeFileSync(fd,JSON.stringify(credentials)+'\n',{encoding:'utf8'});}
 finally {fs.closeSync(fd)}
 fs.chmodSync(secretPath,0o600);
 readSecrets(secretPath);
 console.error('PRIVATE_MCP_CREDENTIALS_VERIFIED (no secret printed)');
}
export function metadata() {
 let present=false;
 try{readSecrets();present=true}catch{}
 return {bot:BOT,world:WORLD,credentialFilePresentAndPrivate:present};
}
