#!/usr/bin/env node
// Offline, explicit password recovery for the existing JoshRS 377 Sylvie.
// Never creates accounts, logs credentials, resets saves or modifies a running server.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { DatabaseSync } from 'node:sqlite';
import { inspectSave } from './inspect-save.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const USERNAME = 'sylvie';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function activeEngine(root) {
  const statePath = path.join(root, 'runtime', 'jparris-377', 'active.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8').trimStart());
  if (typeof state.engine !== 'string' || !path.isAbsolute(state.engine)) throw Error('Active engine is invalid');
  const runtime = fs.realpathSync(path.join(root, 'runtime', 'jparris-377'));
  const engine = fs.realpathSync(state.engine);
  if (!engine.toLowerCase().startsWith(runtime.toLowerCase() + path.sep)) throw Error('Engine is outside private JoshRS runtime');
  for (const file of ['package.json', 'src/app.ts']) {
    if (!fs.statSync(path.join(engine, file)).isFile()) throw Error('Configured engine is incomplete');
  }
  return engine;
}

export function checkServerOffline() {
  if (process.platform !== 'win32') throw Error('This recovery procedure is for the JParris Windows installation only');
  // Port checks alone are insufficient: the user's engine process existed with NO listeners.
  const script = [
    "$ErrorActionPreference='Stop'",
    '$p=@(Get-CimInstance Win32_Process -Filter "Name=\'node.exe\'" | Where-Object {$_.CommandLine -match \'src[/\\\\]app\\.ts\'})',
    '$l=@(Get-NetTCPConnection -State Listen -LocalPort 52402,8888,43500,45099,43501 -ErrorAction SilentlyContinue)',
    'if($p.Count -ne 0 -or $l.Count -ne 0){"BUSY"}else{"OFFLINE"}'
  ].join(';');
  const output = execFileSync('powershell.exe', ['-NoProfile','-NonInteractive','-Command',script], {
    encoding:'utf8', timeout:12000, windowsHide:true
  }).trim();
  if (output !== 'OFFLINE') throw Error('JoshRS engine process or service port still present. Close the game and stop the actual server gracefully with Ctrl+C; never force-kill it for this tool.');
}

function verifyAccount(dbPath) {
  const db = new DatabaseSync(dbPath, { readOnly:true });
  try {
    if (db.prepare('PRAGMA quick_check').all().some(row=>row.quick_check !== 'ok')) throw Error('SQLite integrity check failed');
    const all = db.prepare('SELECT COUNT(*) AS total FROM account').get().total;
    const matches = db.prepare('SELECT id,username,password FROM account WHERE username=?').all(USERNAME);
    if (matches.length !== 1 || !Number.isInteger(matches[0].id)) throw Error('Exact existing Sylvie account not found; no account was created');
    const account = matches[0];
    if (typeof account.password !== 'string' || !/^\$2[aby]\$\d{2}\$/.test(account.password)) throw Error('Stored account hash has an unexpected format');
    return { id:account.id, username:account.username, oldHash:account.password, total:all };
  } finally { db.close(); }
}

function backupWholeWorld(root, engine, sourceFiles) {
  const dir = path.join(root, 'runtime','jparris-377','save-backups');
  fs.mkdirSync(dir, {recursive:true});
  const dest = fs.mkdtempSync(path.join(dir, 'offline-password-recovery-'));
  // Keep a full snapshot of players, database and WAL/SHM together, never just one account row.
  const players = path.join(engine,'data','players');
  fs.cpSync(players, path.join(dest,'players'), {recursive:true,errorOnExist:true,force:false});
  const files = [];
  const walk=(folder,rel='')=>{
    for(const item of fs.readdirSync(folder,{withFileTypes:true})){
      const next=path.join(rel,item.name), source=path.join(folder,item.name);
      if(item.isDirectory())walk(source,next);
      else if(item.isFile())files.push({source,relative:path.join('players',next)});
      else throw Error('Non-regular player save encountered: backup aborted');
    }
  };
  walk(players);
  for(const suffix of ['','-wal','-shm']) {
    const original=path.join(engine,'db.sqlite'+suffix);
    if(fs.existsSync(original)){
      fs.copyFileSync(original,path.join(dest,'db.sqlite'+suffix),fs.constants.COPYFILE_EXCL);
      files.push({source:original,relative:'db.sqlite'+suffix});
    }
  }
  const manifest=[];
  for(const f of files){
    const copied=path.join(dest,f.relative);
    const originalHash=sha(f.source), copiedHash=sha(copied);
    if(originalHash!==copiedHash)throw Error('A source file changed during backup. Refusing to change login.');
    manifest.push({relative:f.relative.replaceAll('\\','/'),bytes:fs.statSync(copied).size,sha256:copiedHash});
  }
  fs.writeFileSync(path.join(dest,'integrity.json'),JSON.stringify({version:1,created:new Date().toISOString(),purpose:'Private offline snapshot before login recovery; never upload',files:manifest},null,2));
  if (!manifest.some(x=>x.relative.toLowerCase()==='players/main/sylvie.sav'))throw Error('Backup omitted Sylvie save');
  const dbRecord=manifest.find(x=>x.relative==='db.sqlite');
  if (!dbRecord || dbRecord.sha256!==sha(sourceFiles.dbPath))throw Error('Backup omitted active account DB');
  return {dest,dbHash:dbRecord.sha256};
}

export async function recover({root,offlineCheck=checkServerOffline,hashPassword=null,comparePassword=null,confirmValue=''}={}) {
  if(confirmValue!=='CHANGE SYLVIE TO A')throw Error('Explicit local confirmation required');
  offlineCheck();
  const engine=activeEngine(root);
  const dbPath=path.join(engine,'db.sqlite');
  const savePath=path.join(engine,'data','players','main',USERNAME+'.sav');
  const saveBytes=fs.readFileSync(savePath);
  const save=inspectSave(saveBytes);
  if(!save.valid)throw Error('Sylvie save verification failed');
  const initialSaveHash=sha(savePath);
  const before=verifyAccount(dbPath);
  const backup=backupWholeWorld(root,engine,{dbPath});
  offlineCheck();
  if(sha(dbPath)!==backup.dbHash || sha(savePath)!==initialSaveHash) throw Error('Source changed since backup. No account changed.');
  if(!hashPassword || !comparePassword){
    const engineRequire=createRequire(path.join(engine,'package.json'));
    const mod=await import(pathToFileURL(engineRequire.resolve('bcrypt-ts')).href);
    hashPassword=mod.hashSync??mod.default?.hashSync;
    comparePassword=mod.compareSync??mod.default?.compareSync;
  }
  if(typeof hashPassword!=='function' || typeof comparePassword!=='function') throw Error('Configured engine bcrypt-ts unavailable');
  const newHash=hashPassword('a',10);
  if(!comparePassword('a',newHash))throw Error('New password hash did not validate');
  const db=new DatabaseSync(dbPath);
  let committed=false;
  try {
    db.exec('BEGIN IMMEDIATE');
    const row=db.prepare('UPDATE account SET password=? WHERE id=? AND username=? AND password=?').run(newHash,before.id,USERNAME,before.oldHash);
    if(row.changes!==1)throw Error('Account changed or not unique; rolling back');
    const count=db.prepare('SELECT COUNT(*) AS total FROM account').get().total;
    if(count!==before.total)throw Error('Account count changed; rolling back');
    db.exec('COMMIT');committed=true;
  } finally {
    if(!committed){try{db.exec('ROLLBACK')}catch{}}
    db.close();
  }
  const after=verifyAccount(dbPath);
  if(after.id!==before.id || after.total!==before.total || !comparePassword('a',after.oldHash)) throw Error('Post-update verification failed: inspect backup locally');
  if(sha(savePath)!==initialSaveHash)throw Error('Save changed unexpectedly: investigate before playing');
  return {status:'PASSWORD_RESET_TO_A',accountIdUnchanged:true,accountCountUnchanged:true,saveSha256Unchanged:true,backupPath:backup.dest,saveXp:save.totalSkillXP};
}

async function main() {
  console.log('JoshRS 377 Sylvie recovery (offline only; no save reset)');
  console.log('WARNING: password "a" is UNSAFE for a LAN, internet-exposed or multiplayer world.');
  console.log('The server MUST be completely stopped first; a missing listener is not proof it stopped.');
  checkServerOffline();
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  let reply;
  try { reply=await rl.question('Type CHANGE SYLVIE TO A to make a verified backup then change ONLY its password: '); }
  finally {rl.close(); }
  if(reply!=='CHANGE SYLVIE TO A'){console.log('CANCELLED: no change');return;}
  const result=await recover({root:ROOT,confirmValue:reply});
  console.log('RESULT: '+result.status);
  console.log('Verified: existing account ID and count unchanged, Sylvie native save unchanged.');
  console.log('Private offline recovery backup: '+result.backupPath);
  console.log('This does not repair the separate server listener problem. Start the server only after investigating its failure.');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(err=>{console.error('RECOVERY BLOCKED: '+err.message.replace(/[\r\n]/g,' '));process.exitCode=1;});
}
