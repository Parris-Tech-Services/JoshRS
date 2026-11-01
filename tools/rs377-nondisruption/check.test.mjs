import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assess, classifyProcesses, inspect, PROTECTED_ACCOUNTS } from './check.mjs';
const script=fileURLToPath(new URL('./check.mjs',import.meta.url));
function fixture(fn) {
  const root=mkdtempSync(path.join(tmpdir(),'joshrs-nondisruption-test-'));
  const engine=path.join(root,'private-engine');
  mkdirSync(path.join(engine,'data','players','main'),{recursive:true});
  for(const n of ['elrothiro.sav','sylvie.sav','Luna.sav'])
    writeFileSync(path.join(engine,'data','players','main',n),'PRIVATE DO NOT PRINT');
  writeFileSync(path.join(engine,'db.sqlite'),'PRIVATE DATABASE DO NOT PRINT');
  try { return fn({root,engine}); } finally { rmSync(root,{recursive:true,force:true}); }
}
const cleanSystem={processes:[],sockets:[]};
test('source-only fixture is never production restart approval',()=>fixture(({root,engine})=>{
  const r=inspect({root,engine,systemSnapshot:cleanSystem});
  assert.equal(r.decision.blocked,true);
  assert.equal(r.decision.verdict,'BLOCKED_UNATTENDED_PRODUCTION_CHANGE');
  assert.equal(r.database,'present');
  assert.deepEqual(PROTECTED_ACCOUNTS.map(n=>r.saves[n]),['present','present','present']);
  assert.ok(r.decision.blockers.some(s=>s.includes('explicit owner approval')));
  assert.equal(r.backup,'unverified');
  assert.equal(JSON.stringify(r).includes('PRIVATE'),false);
}));
test('active Elrothiro/Sylvie/Luna sessions block and never show IP or credentials',()=>fixture(({root,engine})=>{
  const secret='password=TOP_SECRET_DO_NOT_LEAK';
  const r=inspect({root,engine,systemSnapshot:{processes:[
    {pid:777,name:'node',command:`node src/app.ts ${secret}`},
    {pid:778,name:'node',command:'node fred-george-isolated/engine/src/app.ts'},
    {pid:779,name:'agy',command:'agy worker --private-token=NEVER_PRINT'}],
    sockets:[{local:52402,remote:50000,state:'Established',pid:777}]}});
  assert.equal(r.activeGameSockets,1);
  assert.ok(r.processes.agyOrCodex>0);
  assert.ok(r.processes.botWorkers>0);
  assert.ok(r.decision.blockers.some(s=>s.includes('Active game TCP')));
  assert.ok(r.decision.blockers.some(s=>s.includes('worker')));
  assert.equal(JSON.stringify(r).includes(secret),false);
  assert.equal(JSON.stringify(r).includes('NEVER_PRINT'),false);
}));
test('unknown process inspection, no engine, missing saves and database fail closed',()=>fixture(({root,engine})=>{
  const r=inspect({root,engine:path.join(root,'does-not-exist'),platform:'unsupported'});
  assert.equal(r.decision.blocked,true);
  assert.equal(r.engineKnown,false);
  assert.equal(r.activeGameSockets,null);
  assert.ok(r.decision.blockers.some(s=>s.includes('unknown')));
  rmSync(path.join(engine,'data','players','main','sylvie.sav'));
  const s=inspect({root,engine,systemSnapshot:cleanSystem});
  assert.equal(s.saves.sylvie,'missing');
  assert.ok(s.decision.blockers.some(x=>x.includes('sylvie')));
}));
test('routine listeners and no connections still never authorise restart',()=>{
  const e={source:'local-read-only',engineKnown:true,socketInspection:true,processInspection:true,
    activeGameSockets:0,processes:{agyOrCodex:0,botWorkers:0,gameCandidates:0},
    saves:{elrothiro:'present',sylvie:'present',luna:'present'},database:'present',backup:'present'};
  assert.equal(assess(e).blocked,true);
  assert.ok(assess(e).blockers.some(s=>s.includes('No unattended')));
});
test('classifies relevant workers without leaking their command lines',()=>{
  assert.deepEqual(classifyProcesses([
    {name:'claude',command:'claude agent'},
    {name:'node',command:'node src/app.ts'},
    {name:'node',command:'node fred-george-isolated/run.mjs'},
    {name:'node',command:'node something-else.js'}
  ]),{agyOrCodex:1,gameCandidates:1,botWorkers:1,otherNode:2});
});
test('CLI refuses unsafe override and CLI gate returns nonzero even in a fixture',()=>fixture(({root,engine})=>{
  const denied=spawnSync(process.execPath,[script,'--force','--engine',engine],{encoding:'utf8'});
  assert.equal(denied.status,2);
  const cli=spawnSync(process.execPath,[script,'--root',root,'--engine',engine,'--json'],{encoding:'utf8'});
  assert.equal(cli.status,2);
  const parsed=JSON.parse(cli.stdout);
  assert.equal(parsed.decision.blocked,true);
  assert.equal(parsed.decision.observed,true);
  assert.equal(cli.stdout.includes('PRIVATE'),false);
}));
test('source cannot use process termination or save/database modification primitives',()=>{
  const source=readFileSync(script,'utf8');
  assert.doesNotMatch(source,/\b(kill|Stop-Process|taskkill|Start-Process|sqlite3|writeFileSync|unlinkSync|renameSync|rmSync|execSync|eval)\s*\(/);
  assert.doesNotMatch(source,/\bssh\b|https?:\/\//);
  assert.match(source,/shell: false/);
});
