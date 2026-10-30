import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {auditSources} from '../audit-duel.mjs'

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-luna-duel-'))
 const engine=path.join(root,'engine'),content=path.join(root,'content')
 fs.mkdirSync(path.join(engine,'src/network/game/client/handler'),{recursive:true})
 fs.mkdirSync(path.join(engine,'src/engine/entity'),{recursive:true})
 fs.mkdirSync(path.join(content,'scripts/minigames/game_duelarena/scripts'),{recursive:true})
 fs.writeFileSync(path.join(engine,'src/network/game/client/handler/OpPlayerHandler.ts'),
   "export class OpPlayerHandler { /* OPPLAYER1 */ }\n")
 fs.writeFileSync(path.join(engine,'src/engine/entity/BotPlayer.ts'),
   "export class BotPlayer { /* Luna */ }\n")
 fs.writeFileSync(path.join(engine,'src/engine/entity/ClientCheatHandler.ts'),
   'function install(){ set_player_op("Challenge", 1, false) }\n')
 fs.writeFileSync(path.join(content,'scripts/minigames/game_duelarena/scripts/duel_arena.rs2'),
   '[proc,toggle_duel_challenge_on]\nset_player_op("Challenge", 1, ^false);\n[opplayer1]\n')
 return {root,engine,content}
}
test('read-only audit locates duel option, server packet handler, actual bot and native game script',()=>{
 const d=fixture()
 try{
  const x=auditSources(d.engine,d.content)
  assert.equal(x.status,'STATIC_AUDIT_ONLY')
  assert.deepEqual(x.checks,{
   playerHandler:true,botClass:true,duelArenaScript:true,
   challengeDefinitionFound:true,playerTriggerScriptFound:true
  })
  assert.deepEqual(x.problems,[])
  assert.ok(x.files.some(f=>f.file.endsWith('/duel_arena.rs2')))
  const original=fs.readFileSync(path.join(d.engine,'src/engine/entity/BotPlayer.ts'),'utf8')
  const script=fileURLToPath(new URL('../audit-duel.mjs',import.meta.url))
  const proc=spawnSync(process.execPath,[script,'--engine',d.engine,'--content',d.content],{encoding:'utf8'})
  assert.equal(proc.status,0,proc.stderr)
  assert.equal(JSON.parse(proc.stdout).checks.botClass,true)
  assert.equal(fs.readFileSync(path.join(d.engine,'src/engine/entity/BotPlayer.ts'),'utf8'),original)
 }finally{fs.rmSync(d.root,{recursive:true,force:true})}
})
test('missing duel wiring produces warnings, not false implementation claims',()=>{
 const d=fixture()
 try{
  fs.rmSync(path.join(d.engine,'src/engine/entity/BotPlayer.ts'))
  fs.writeFileSync(path.join(d.content,'scripts/minigames/game_duelarena/scripts/duel_arena.rs2'),
    '[proc,toggle_duel_challenge_on]\nset_player_op("Challenge", 1, ^false);\n')
  const report=auditSources(d.engine,d.content)
  assert.equal(report.checks.botClass,false)
  assert.equal(report.checks.playerTriggerScriptFound,false)
  assert.ok(report.problems.length>=2)
 }finally{fs.rmSync(d.root,{recursive:true,force:true})}
})
test('requires explicit source paths and refuses to guess active world',()=>{
 const command=fileURLToPath(new URL('../audit-duel.mjs',import.meta.url))
 const run=spawnSync(process.execPath,[command],{encoding:'utf8'})
 assert.equal(run.status,1)
 assert.match(run.stderr,/Both --engine and --content are required/)
})
