#!/usr/bin/env node
// JoshRS 377: replace a temporary password on an EXISTING private account.
// No new accounts, no player-save writes, no plaintext credentials in arguments/logs.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function offline() {
  if (process.platform !== 'win32') throw Error('This helper must run on JParrisDesktop, not in CI');
  const check = String.raw`$ErrorActionPreference='Stop'
$p=@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {$_.CommandLine -match 'src[/\\]app\.ts'})
$s=@(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object {$_.LocalPort -in 52402,8888,43500,43501,45099})
if($p.Count -gt 0 -or $s.Count -gt 0){'BUSY'}else{'OFFLINE'}`;
  let response = '';
  try {
    response = execFileSync('powershell.exe', ['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(check,'utf16le').toString('base64')], {
      encoding:'utf8',timeout:20000,windowsHide:true
    }).trim();
  } catch { throw Error('Cannot independently confirm server stopped. No account changed'); }
  if (response !== 'OFFLINE') throw Error('JoshRS server is running or offline check inconclusive; stop gracefully first');
}

function activeEngine() {
  const runtime = fs.realpathSync(path.join(ROOT, 'runtime','jparris-377'));
  const state = JSON.parse(fs.readFileSync(path.join(runtime,'active.json'),'utf8').trimStart());
  if (typeof state.engine !== 'string' || !path.isAbsolute(state.engine)) throw Error('Invalid selected world');
  const engine = fs.realpathSync(state.engine);
  if (!engine.toLowerCase().startsWith(runtime.toLowerCase() + path.sep)) throw Error('Selected engine outside private runtime');
  if (!fs.statSync(path.join(engine,'src','app.ts')).isFile()) throw Error('Selected engine incomplete');
  return {engine,runtime};
}

export function verifyBackup(engine,backup,username='elrothiro') {
  const manifest = JSON.parse(fs.readFileSync(path.join(backup,'integrity.json'),'utf8').trimStart());
  if (manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) throw Error('Missing verified backup manifest');
  const names = new Set();
  const backupRoot = fs.realpathSync(backup), engineRoot = fs.realpathSync(engine);
  for (const entry of manifest.files) {
    const rel = entry.relativePath;
    if (typeof rel !== 'string' || !(/^(players\/[^./\\][^\\]*|db\.sqlite(?:-wal|-shm)?)$/.test(rel)) ||
        rel.includes('..') || rel.includes('\\') || names.has(rel)) throw Error('Unsafe backup entry');
    names.add(rel);
    const from = fs.realpathSync(path.join(backup, ...rel.split('/')));
    const to = fs.realpathSync(rel.startsWith('players/')
      ? path.join(engine,'data', ...rel.split('/'))
      : path.join(engine,rel));
    if (!from.startsWith(backupRoot+path.sep) || !to.startsWith(engineRoot+path.sep)) throw Error('Backup path outside approved folders');
    if (fs.statSync(from).size !== entry.bytes || sha(from) !== String(entry.sha256).toLowerCase()) throw Error('Backup checksum failure');
    if (sha(to) !== sha(from)) throw Error('Live data differs from backup: create a fresh cold snapshot');
  }
  if (!names.has('db.sqlite') || !names.has('players/main/'+username+'.sav')) throw Error('Backup missing target character or database');
  for (const suffix of ['-wal','-shm']) {
    if (fs.existsSync(path.join(engine,'db.sqlite'+suffix)) !== names.has('db.sqlite'+suffix)) {
      throw Error('SQLite journal files differ from backup');
    }
  }
  return true;
}

function hidden(label) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') throw Error('An interactive PowerShell terminal is required');
  process.stdout.write(label);
  return new Promise((resolve,reject) => {
    let value='';
    process.stdin.setEncoding('utf8');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const onData = data => {
      for(const c of data) {
        if(c === '\u0003') return finish(Error('Cancelled'));
        if(c === '\r' || c === '\n') return finish();
        if(c === '\b' || c === '\u007f') {value=value.slice(0,-1);continue;}
        if(c >= ' ' && value.length < 64) value+=c;
      }
    };
    const finish = err => {
      process.stdin.removeListener('data',onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      err?reject(err):resolve(value);
    };
    process.stdin.on('data',onData);
  });
}

async function main() {
  if (process.argv.length !== 2) throw Error('Run without arguments; passwords must never appear on the command line');
  offline();
  const {engine,runtime}=activeEngine();
  const name='elrothiro';
  const dir=path.join(runtime,'save-backups');
  const backups=fs.readdirSync(dir).filter(n=>/^manual-\d{8}-\d{6}-\d+$/.test(n)).sort().reverse();
  let selected=null;
  for(const b of backups) {
    try {verifyBackup(engine,path.join(dir,b),name);selected=b;break;}
    catch { /* Search for an exact-match verified offline snapshot. */ }
  }
  if (!selected) throw Error('No matching verified cold backup; stop the world and run Protect-Elrothiro.ps1 -CreateBackup');
  const dbPath=path.join(engine,'db.sqlite');
  const dbCheck=new DatabaseSync(dbPath,{readOnly:true});
  let account;
  try {
    if(dbCheck.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw Error('Database failed SQLite integrity check');
    account=dbCheck.prepare('SELECT id,username,password FROM account WHERE username=?').get(name);
    if(!account || !Number.isInteger(account.id) || typeof account.password !== 'string') throw Error('Existing account not found');
  } finally {dbCheck.close();}
  const requireEngine=createRequire(path.join(engine,'package.json'));
  const bcrypt=await import(pathToFileURL(requireEngine.resolve('bcrypt-ts')).href);
  const hash=bcrypt.hashSync??bcrypt.default?.hashSync;
  const compare=bcrypt.compareSync??bcrypt.default?.compareSync;
  if (typeof hash !== 'function' || typeof compare !== 'function') throw Error('Engine bcrypt-ts API unavailable');
  if (!compare('a',account.password)) throw Error('The temporary password is no longer a; refusing an unverified account change');
  console.log('Existing Elrothiro account and matching offline backup confirmed: '+selected);
  console.log('Enter a unique 14-20 character lowercase-and-digit password (no spaces). Input stays hidden.');
  const first=await hidden('New password: ');
  const second=await hidden('Confirm new password: ');
  if (first !== second || !/^(?=.*[a-z])(?=.*[0-9])[a-z0-9]{14,20}$/.test(first)) throw Error('Password mismatch or invalid length/characters');
  if ((await hidden('Type CHANGE to confirm: ')) !== 'CHANGE') throw Error('Cancelled before account change');
  offline();
  verifyBackup(engine,path.join(dir,selected),name);
  const nextHash=hash(first,10);
  if(!compare(first,nextHash)) throw Error('Generated password hash failed self-check');
  const db=new DatabaseSync(dbPath);
  let tx=false;
  try {
    db.exec('BEGIN IMMEDIATE');tx=true;
    const result=db.prepare('UPDATE account SET password=? WHERE id=? AND username=? AND password=?')
      .run(nextHash,account.id,name,account.password);
    if(result.changes!==1) throw Error('Account changed concurrently; rolling back');
    if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok') throw Error('Database integrity check failed; rolling back');
    db.exec('COMMIT');tx=false;
  } finally {
    if(tx) db.exec('ROLLBACK');
    db.close();
  }
  console.log('RESULT: ELROTHIRO_STRONG_PASSWORD_SET; existing account ID retained, no character saves edited.');
  console.log('Start the original world, verify in-game login and character progress, then create a fresh cold backup.');
}
main().catch(e=>{console.error('RECOVERY BLOCKED: '+String(e.message).replace(/[\r\n]/g,' '));process.exitCode=1;});
