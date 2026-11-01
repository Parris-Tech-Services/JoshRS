#!/usr/bin/env node
const checks=[
{id:'source',status:'pass',detail:'Source-only report'},
{id:'world-state',status:'blocked',detail:'Inbound world decoder unverified'},
{id:'world-id',status:'blocked',detail:'World identity unverified'},
{id:'bot-login',status:'blocked',detail:'Bot login unverified'}];
const report={schemaVersion:1,mode:'source-only',worldReady:false,checks,blockers:checks.filter(c=>c.status==='blocked').map(c=>c.detail),nextTask:'Build inbound decoder and prove isolated two-client gameplay'};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else{console.log('JoshRS doctor: worldReady=false');for(const c of checks)console.log(c.status+' '+c.id+': '+c.detail);console.log('NEXT '+report.nextTask);}
