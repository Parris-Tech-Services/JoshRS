#!/usr/bin/env node
// Private read-only SQLite account metadata check for JoshRS 377.
// Prints NO passwords, emails, IPs, or account record contents.
import fs from 'node:fs'
import crypto from 'node:crypto'
import {DatabaseSync} from 'node:sqlite'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
export function inspectAccountDb(filename,username='elrothiro') {
 const stat=fs.statSync(filename)
 if(stat.size<100)throw Error('Account database is empty or truncated; no login can be confirmed')
 const db=new DatabaseSync(filename,{readOnly:true})
 try {
  const integrity=db.prepare('PRAGMA quick_check').all()
  if(!integrity.length || integrity.some(x=>x.quick_check!=='ok'))throw Error('SQLite quick_check failed')
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='account'").all()
  if(!tables.length)throw Error('No account table in this database')
  const accounts=db.prepare('SELECT COUNT(*) AS total FROM account').get().total
  const match=db.prepare('SELECT 1 AS present FROM account WHERE lower(username)=lower(?) LIMIT 1').get(username)
  return {
    sqliteVerified:true,bytes:stat.size,accountRecords:Number(accounts),
    characterAccountPresent:Boolean(match),
    sha256:crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'),
    warning:'A matching login record does not by itself prove password or save-file compatibility.'
  }
 } finally {db.close()}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 if(process.argv.length!==3){console.error('Usage: node inspect-account-db.mjs path/to/db.sqlite');process.exitCode=2}
 else try{console.log(JSON.stringify(inspectAccountDb(process.argv[2]),null,2))}
 catch(e){console.error('Account database check failed: '+e.message);process.exitCode=1}
}
