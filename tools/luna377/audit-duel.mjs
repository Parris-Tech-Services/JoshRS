#!/usr/bin/env node
// Read-only audit for JoshRS #377 Luna's dead "Challenge" interaction.
// Never reads .env/credentials, writes player files, or modifies game content.
import fs from 'node:fs'
import path from 'node:path'

const keywords = Object.freeze({
  challenge: /\bChallenge\b|challenge.{0,30}luna|luna.{0,30}challenge/i,
  duel: /\bduel\b|APPLAYER1|OPPLAYER1|duel2accept|duel_arena/i,
  bot: /BotPlayer|DEV_LUNA_BOT|spawnDevelopmentBots/i,
  packet: /class OpPlayerHandler|class OpPlayerDecoder|setInteraction\(Interaction\.ENGINE/i
})
function scan(root, directory, options={}) {
  if (!fs.existsSync(directory)) return []
  const files=[]
  const skip=new Set(['.git','node_modules','dist','build','.parcel-cache','target','.next'])
  function visit(folder,depth){
    if(depth>11||files.length>15000) throw Error('Source scope exceeds safe audit limits')
    for (const entry of fs.readdirSync(folder,{withFileTypes:true})) {
      if(entry.isSymbolicLink()) continue
      const absolute=path.join(folder,entry.name)
      if(entry.isDirectory()) { if(!skip.has(entry.name))visit(absolute,depth+1);continue }
      if(!entry.isFile()||!/\.(ts|js|rs2)$/.test(entry.name))continue
      const stat=fs.statSync(absolute)
      if(stat.size>3*1024*1024)continue
      const content=fs.readFileSync(absolute,'utf8')
      const matched=Object.fromEntries(Object.entries(keywords).filter(([,rx])=>rx.test(content)).map(([k])=>[k,true]))
      if(Object.keys(matched).length) {
        const lines=content.split(/\r?\n/)
        const hits=[]
        for(let i=0;i<lines.length;i++){
          if(/Challenge Luna|set_player_op\(["']Challenge|^\s*\[(?:applayer1|opplayer1)|duel2accept|class OpPlayerHandler|class BotPlayer/.test(lines[i])) {
            hits.push({line:i+1,excerpt:lines[i].slice(0,180)})
          }
          if(hits.length>=15)break
        }
        files.push({file:path.relative(root,absolute).replaceAll(path.sep,'/'),matched,hits})
      }
    }
  }
  visit(directory,0)
  return files
}
export function auditSources(engine,content){
  const root=path.dirname(path.resolve(engine)),eng=path.resolve(engine),cnt=path.resolve(content)
  for(const d of [eng,cnt])if(!fs.existsSync(d)||!fs.statSync(d).isDirectory())throw Error('Source directory missing: '+d)
  const files=[
    ...scan(root,path.join(eng,'src')),
    ...scan(root,path.join(cnt,'scripts'))
  ]
  const playerHandler=files.find(f=>f.file.endsWith('OpPlayerHandler.ts'))
  const duelScripts=files.filter(f=>f.file.includes('game_duelarena'))
  const gameDuel=duelScripts.find(f=>f.file.endsWith('duel_arena.rs2'))
  const botClass=files.find(f=>f.file.endsWith('BotPlayer.ts'))
  const challengeCode=files.filter(f=>f.hits.some(x=>/Challenge Luna|set_player_op\(["']Challenge/.test(x.excerpt)))
  const playerScriptHandlers=files.filter(f=>f.hits.some(x=>/^\s*\[(?:applayer1|opplayer1)/.test(x.excerpt)))
  const problems=[]
  if(!playerHandler)problems.push('OPPLAYER packet handler not found in active engine source')
  if(!botClass)problems.push('BotPlayer.ts not found in active engine source')
  if(!gameDuel)problems.push('Native Duel Arena script not found in active content')
  if(challengeCode.length===0)problems.push('Challenge option source not found in scanned engine/content; might be in client or custom script')
  if(playerScriptHandlers.length===0)problems.push('No direct APPLAYER1/OPPLAYER1 script label found in scanned content; verify server trigger dispatch')
  const report={
    status:'STATIC_AUDIT_ONLY',
    nativeDuelMode:'The default 377 Duel Arena challenge depends on game area, reciprocal player consent, scripts and server actions.',
    checks:{playerHandler:!!playerHandler,botClass:!!botClass,duelArenaScript:!!gameDuel,challengeDefinitionFound:challengeCode.length>0,playerTriggerScriptFound:playerScriptHandlers.length>0},
    problems,
    files,
    requestedAcceptance:[
      'One click delivers the expected OPPLAYER index and validated visible target slot',
      'Luna is a real active BotPlayer and has an authorized, explicit consent response',
      'Outside Duel Arena: either open a separate no-stakes sparring flow or show an explicit refusal; never silently do nothing',
      'Within Duel Arena: use existing duel request, acceptance, rule and combat handlers; no automatic stakes',
      'No rewards, inventory or stats are changed except through ordinary validated world actions',
      'Test Elrothiro request, Luna accept/decline, countdown, combat, win/loss, timeout and logout',
      'Preserve active Elrothiro and Luna saves and database before any server restart'
    ]
  }
  return report
}
export function main(args){
 let engine=null,content=null
 for(let i=0;i<args.length;i+=2) {
   if(i+1>=args.length)throw Error('Usage: node audit-duel.mjs --engine <active-engine> --content <active-content>')
   if(args[i]==='--engine')engine=args[i+1]
   else if(args[i]==='--content')content=args[i+1]
   else throw Error('Unknown option '+args[i])
 }
 if(!engine||!content)throw Error('Both --engine and --content are required. No guess of active runtime allowed.')
 const result=auditSources(engine,content)
 console.log(JSON.stringify(result,null,2))
 return result
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 try{main(process.argv.slice(2))}catch(err){console.error('Read-only Luna duel audit failed:',err.message);process.exitCode=1}
}
