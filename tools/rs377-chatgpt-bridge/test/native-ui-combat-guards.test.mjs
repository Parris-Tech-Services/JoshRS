import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const web=readFileSync(new URL('../../rs377-bot-bench/engine-patch/src/web.ts',import.meta.url),'utf8');
const trace=readFileSync(new URL('../../rs377-bot-bench/engine-patch/src/engine/observer/Native377Trace.ts',import.meta.url),'utf8');
const script=readFileSync(new URL('../../../content-factory/patch_377_sdk_trace.py',import.meta.url),'utf8');
const sdk=readFileSync(new URL('../src/sdk-bridge.mjs',import.meta.url),'utf8');

test('all new observations remain isolated, authorised and non-mutating',()=>{
 assert.match(web,/RS377_OBSERVER_ISOLATED/);
 assert.match(web,/isClientConnected\(bot\)/);
 assert.match(web,/bot\.client\.player !== bot/);
 assert.match(web,/timingSafeEqual/);
 assert.match(trace,/NODE_PROFILE === 'joshrs_ci_377'/);
 assert.match(script,/GITHUB_ACTIONS/);
 assert.match(script,/b5ac859b47915afb545e60e4c1208f25d43cb3fb/);
 assert.match(trace,/WeakMap<Player, Trace>/);
});
test('bank/shop own account and exact pinned RuneScript input varps',()=>{
 for(const v of ['bank_main','shop_template','bankcert','shop_buy','shop_sell','shop_haggle'])
   assert.ok(web.includes("'"+v+"'"),v);
 assert.match(web,/bot\.invs\.get\(bankType\)/);
 assert.match(web,/Array\.from\(World\.invs\)/);
 assert.match(web,/trace\?\.textOverrides\.find\(entry => entry\.component === titleId\)/);
 assert.match(web,/Math\.min\(1000,Math\.max\(-5000,diff \* bot\.vars\[shopHaggleVar\]\)\)/);
 assert.match(web,/Math\.max\(100,multiplier - haggled\)/);
 assert.match(web,/Math\.trunc\(\(factor \* type\.cost\) \/ 1000\)/);
 assert.match(web,/haveShop && stock\?\.every\(item => item !== null\)/);
});
test('dialogue is the real pending native server UI, not guessed components',()=>{
 assert.match(web,/ScriptState\.PAUSEBUTTON/);
 assert.match(web,/\[\.\.\.bot\.resumeButtons\]/);
 assert.match(web,/Component\.get\(id\)/);
 assert.match(web,/trace\.dialogPageRevision/);
 assert.match(trace,/packet instanceof IfSetText/);
 assert.match(trace,/packet instanceof IfOpenChat/);
 assert.match(trace,/verifiedPageText\(/);
 assert.match(sdk,/pendingComponentIds\?\.includes\(opt\.componentId\)/);
 assert.match(sdk,/type:'dialog_resume',componentId:opt\.componentId/);
});
test('combat and UI are never invented without source event evidence',()=>{
 assert.match(web,/const trace = readSdkTrace\(bot, World\.currentTick\)/);
 assert.match(web,/const playerState = trace && combat \?/);
 assert.match(web,/lastCombatId >= 0 \? bot\.vars\[lastCombatId\] : null/);
 assert.match(trace,/unknownDamageSource \? null : \[\]/);
 assert.match(web,/const shop = !shopOpen/);
 assert.match(web,/\} : null;/);
 assert.match(sdk,/const missingRequired=s\.unsupported\.filter\(key=>key!=='questStages'\)/);
});
