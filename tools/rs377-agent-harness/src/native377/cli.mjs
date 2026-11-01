#!/usr/bin/env node
/**
 * Safe native-377 standalone probe for Agy.
 * --doctor never connects or reads secrets.
 * --login does a single normal bot login, optional one walking packet, then exits.
 * It does not claim to decode game state, reach waypoints, or complete objectives.
 */
import {readFile, stat} from 'node:fs/promises';
import {Client377,validate377Target} from './client.mjs';
const help=`JoshRS 377 native bot diagnostic (Agy / isolated test first)

Usage:
  node src/native377/cli.mjs --doctor
  node src/native377/cli.mjs --login
  node src/native377/cli.mjs --login --walk=3233,3217

Required for --login:
  JOSHRS_BOT_USERNAME           disposable bot only
  JOSHRS_BOT_PASSWORD_FILE      private text file chmod 600, NOT committed
  JOSHRS_BOT_RSA_PUBLIC_FILE    public PEM, NOT server private.pem
  JOSHRS_BOT_CRC_FILE           binary cache /crc response, >=36 bytes
  JOSHRS_BOT_ACCOUNT_APPROVED   YES (normal login may create a new account)

Network defaults: isolated / 127.0.0.1 / 53402.
Optional JOSHRS_BOT_WORLD=family requires JOSHRS_BOT_LIVE_APPROVED=YES.
Optional JOSHRS_BOT_HOST and JOSHRS_BOT_PORT only accept private network targets.
No automatic reconnect, no admin packets, no player/world-state decoding.
`;
const args=process.argv.slice(2),doctor=args.length===0||args.includes('--doctor')||args.includes('--help');
if(doctor){
  process.stdout.write(help);
  if(args.includes('--help'))process.exit(0);
}
if(args.some(a=>a!=='--doctor'&&a!=='--help'&&a!=='--login'&&!/^--walk=\d{1,5},\d{1,5}$/.test(a))){
  process.stderr.write('Unknown argument; use --help\n');process.exit(2);
}
const world=process.env.JOSHRS_BOT_WORLD||'isolated';
const host=process.env.JOSHRS_BOT_HOST||'127.0.0.1';
const port=Number(process.env.JOSHRS_BOT_PORT||(world==='isolated'?53402:52402));
let target;
try{target=validate377Target({host,port,world,approvedLive:process.env.JOSHRS_BOT_LIVE_APPROVED==='YES'});}
catch(e){process.stderr.write('BLOCKED: '+e.message+'\n');process.exit(2);}
if(doctor){
  process.stdout.write('Mode: '+target.world+' | target configured: '+target.host+':'+target.port+'\n');
  process.stdout.write('Source files provided: public PEM '+Boolean(process.env.JOSHRS_BOT_RSA_PUBLIC_FILE)+
    ', CRC '+Boolean(process.env.JOSHRS_BOT_CRC_FILE)+
    ', separate password file '+Boolean(process.env.JOSHRS_BOT_PASSWORD_FILE)+'\n');
  process.stdout.write('No network connection or file access performed.\n');
  process.exit(0);
}
if(!args.includes('--login')){process.stderr.write('Explicit --login required\n');process.exit(2);}
if(process.env.JOSHRS_BOT_ACCOUNT_APPROVED!=='YES'){
  process.stderr.write('BLOCKED: normal login may automatically register this bot; set JOSHRS_BOT_ACCOUNT_APPROVED=YES after approval.\n');process.exit(2);
}
if(!process.env.JOSHRS_BOT_USERNAME||!process.env.JOSHRS_BOT_RSA_PUBLIC_FILE||
   !process.env.JOSHRS_BOT_PASSWORD_FILE||!process.env.JOSHRS_BOT_CRC_FILE){
  process.stderr.write('BLOCKED: bot-only credentials, PUBLIC key and cache CRC files required.\n');process.exit(2);
}
let client;
try{
  const passFile=process.env.JOSHRS_BOT_PASSWORD_FILE;
  const meta=await stat(passFile);
  if(!meta.isFile()||(meta.mode&0o077)!==0)throw new Error('Bot password file must be a regular file with chmod 600 permissions');
  const [passwordRaw,publicKeyPem,rawCrc]=await Promise.all([
    readFile(passFile,'utf8'),
    readFile(process.env.JOSHRS_BOT_RSA_PUBLIC_FILE,'utf8'),
    readFile(process.env.JOSHRS_BOT_CRC_FILE)
  ]);
  if(rawCrc.length<36)throw new Error('CRC data must contain at least 36 bytes');
  const password=passwordRaw.replace(/\r?\n$/,'');
  client=new Client377({
    ...target,approvedLive:process.env.JOSHRS_BOT_LIVE_APPROVED==='YES',
    username:process.env.JOSHRS_BOT_USERNAME,password,publicKeyPem,crc:rawCrc.subarray(0,36)
  });
  const result=await client.connect();
  process.stdout.write('LOGIN ACCEPTED for disposable bot '+result.username+' (reply '+result.response+
    '). In-game visibility and save NOT VERIFIED.\n');
  const movement=args.find(a=>a.startsWith('--walk='));
  if(movement){
    const [x,z]=movement.slice(7).split(',').map(Number);
    const status=client.walkTo(x,z);
    process.stdout.write('MOVE '+status.status+' to '+x+','+z+' — genuine client packet sent; world state NOT decoded.\n');
  }
  await new Promise(r=>setTimeout(r,2000));
}catch(e){
  process.stderr.write('BLOCKED: '+e.message+'\n');process.exitCode=1;
}finally{client?.close();}
