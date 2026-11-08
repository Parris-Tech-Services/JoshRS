#!/usr/bin/env node
/**
 * Verify the complete 39-discriminant mapping against the REAL pinned upstream
 * RS-SDK sdk/types.ts, not a copied list or an AI-generated type guess.
 */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {SDK377_ACTION_TYPES,SDK377_ACTION_COVERAGE} from '../src/sdk-action-coverage.mjs';
const file=process.argv[2];
if(!file)throw new Error('Pinned rs-sdk sdk/types.ts path required');
const source=readFileSync(file,'utf8');
const from=source.indexOf('export type BotAction =');
const to=source.indexOf('export interface ActionResult',from);
if(from<0||to<=from)throw new Error('Missing canonical pinned BotAction union');
const text=source.slice(from,to);
const actual=[...text.matchAll(/\btype:\s*'([a-zA-Z0-9_]+)'/g)].map(m=>m[1]);
assert.equal(actual.length,39,'original pinned SDK must expose exactly 39 action variants');
assert.equal(new Set(actual).size,39,'upstream SDK action types cannot duplicate');
assert.deepEqual([...SDK377_ACTION_TYPES].sort(),[...actual].sort(),
 'JoshRS 377 mapping MUST cover the exact upstream action union');
for(const type of actual){
 const c=SDK377_ACTION_COVERAGE[type];
 assert.ok(c,'action missing coverage entry: '+type);
 assert.ok(['native','guarded','read','client','absent'].includes(c.mode));
 assert.equal(c.verifiedNativeEffect,false,
  'Source mapping must not claim a native game effect without a playtest: '+type);
 assert.equal(c.verifiedAfterRelog,false,
  'Source mapping must not claim save persistence without relog: '+type);
}
console.log(JSON.stringify({status:'all_39_upstream_action_types_mapped',
 expected:39,found:actual.length,
 native:actual.filter(t=>SDK377_ACTION_COVERAGE[t].mode==='native').length,
 guarded:actual.filter(t=>SDK377_ACTION_COVERAGE[t].mode==='guarded').length,
 observed:actual.filter(t=>SDK377_ACTION_COVERAGE[t].mode==='read').length,
 clientOnly:actual.filter(t=>SDK377_ACTION_COVERAGE[t].mode==='client').length,
 absent:actual.filter(t=>SDK377_ACTION_COVERAGE[t].mode==='absent').length,
 realGameplayVerification:false}));
