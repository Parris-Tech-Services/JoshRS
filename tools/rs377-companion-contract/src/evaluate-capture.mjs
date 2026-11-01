#!/usr/bin/env node
/**
 * Task 35: command-line two-Java-client acceptance evaluator.
 * Offline: reads only an operator-selected JSON trace; never connects to game,
 * fetches chat, authenticates accounts or declares final live verification.
 */
import {readFile} from 'node:fs/promises';
import {checkTwoClientAcceptance} from './two-client.mjs';
const argv=process.argv.slice(2);
if(argv.length!==3||argv[0]!=='--input'||!['fixture','real-client-capture'].includes(argv[2])){
 process.stderr.write('Usage: node src/evaluate-capture.mjs --input PATH fixture|real-client-capture\n');
 process.exitCode=2;
}else{
 try{
  const raw=await readFile(argv[1],'utf8');
  if(raw.length>2_000_000)throw Error('Capture file too large');
  const parsed=JSON.parse(raw);
  const result=checkTwoClientAcceptance({
    events:parsed.events,bot:parsed.bot??'HarnessTest',owner:parsed.owner??'Elrothiro',
    worldId:parsed.worldId??null,evidenceOrigin:argv[2]
  });
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  // Even a passing JSON contract cannot independently prove two physical clients.
  // Exit 3 means source capture must be cross-checked in the Java client.
  process.exitCode=result.status==='blocked'?1:3;
 }catch(e){process.stderr.write('BLOCKED: '+e.message+'\n');process.exitCode=2;}
}
