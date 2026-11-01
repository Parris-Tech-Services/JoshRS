#!/usr/bin/env node
/** Offline parser. It NEVER calls a game server or runs operator-supplied code. */
import {readFile,stat,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseEvidenceCapture} from '../lib/capture.mjs';
const args=process.argv.slice(2);
if(args.length!==2&&args.length!==4){
 process.stderr.write('Usage: node cli/capture-evidence.mjs --input PATH [--output NEW_PATH]\n');
 process.exitCode=2;
}else if(args[0]!=='--input'||(args.length===4&&args[2]!=='--output')){
 process.stderr.write('BLOCKED: invalid_arguments\n');
 process.exitCode=2;
}else{
 try{
  if(args.length===4&&resolve(args[1])===resolve(args[3]))throw Error('output_must_differ');
  const s=await stat(args[1]);
  if(!s.isFile()||s.size>65536)throw Error('invalid_capture_size');
  const data=await readFile(args[1],'utf8');
  const parsed=parseEvidenceCapture(data);
  const result=JSON.stringify(parsed,null,2)+'\n';
  if(args.length===4)await writeFile(args[3],result,{encoding:'utf8',flag:'wx',mode:0o600});
  else process.stdout.write(result);
 }catch(e){
  const msg=typeof e.message==='string'&&/^[a-z_]+$/.test(e.message)?e.message:'io_or_validation_error';
  process.stderr.write('BLOCKED: '+msg+'\n');
  process.exitCode=2;
 }
}
