import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {inspectAccountDb} from '../inspect-account-db.mjs'

test('detect Elrothiro account without outputting any password or private field',()=>{
 const p=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-accounts-')),'db.sqlite')
 try {
  const db=new DatabaseSync(p)
  db.exec('CREATE TABLE account(id INTEGER PRIMARY KEY, username TEXT, password TEXT, registration_ip TEXT)')
  db.prepare('INSERT INTO account(username,password,registration_ip) VALUES (?,?,?)').run('Elrothiro','SECRET_DO_NOT_LOG','private-ip')
  db.close()
  const result=inspectAccountDb(p)
  assert.equal(result.sqliteVerified,true)
  assert.equal(result.characterAccountPresent,true)
  assert.equal(result.accountRecords,1)
  assert.match(result.sha256,/^[0-9a-f]{64}$/)
  assert.ok(!JSON.stringify(result).includes('SECRET_DO_NOT_LOG'))
  assert.ok(!JSON.stringify(result).includes('private-ip'))
 }finally{fs.rmSync(path.dirname(p),{recursive:true,force:true})}
})
test('detect valid empty-account database without calling it a playable login',()=>{
 const p=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-empty-')),'db.sqlite')
 try{
  const db=new DatabaseSync(p)
  db.exec('CREATE TABLE account(id INTEGER PRIMARY KEY, username TEXT)')
  db.close()
  const result=inspectAccountDb(p)
  assert.equal(result.sqliteVerified,true)
  assert.equal(result.accountRecords,0)
  assert.equal(result.characterAccountPresent,false)
 }finally{fs.rmSync(path.dirname(p),{recursive:true,force:true})}
})
