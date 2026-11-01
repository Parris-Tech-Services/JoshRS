#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
let sourceCommit='unknown';
try{sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{}
const checks=[{id:'git-source',status:sourceCommit==='unknown'?'blocked':'pass',detail:sourceCommit==='unknown'?'Git commit unavailable':'Source revision available'},{id:'world-state',status:'blocked',detail:'Inbound 377 world-state decoder not verified'},{id:'world-id',status:'blocked',detail:'Authoritative world identity not verified'},{id:'bot-login',status:'blocked',detail:'Disposable bot login not verified'}];
const report={schemaVersion:1,mode:'source-only',sourceCommit,worldReady:false,checks,blockers:checks.filter(c=>c.status==='blocked').map(c=>c.detail),nextTask:'Build inbound 377 world-state decoder and prove isolated two-client gameplay'};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else{console.log('JoshRS doctor: worldReady=false');console.log('Source: '+sourceCommit);for(const c of checks)console.log(c.status+' '+c.id+': '+c.detail);console.log('NEXT '+report.nextTask)}
