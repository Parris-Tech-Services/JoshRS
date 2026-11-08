import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Source-only checks complement (but never replace) native-377 server CI.
const file=readFileSync(new URL('../../rs377-bot-bench/engine-patch/src/web.ts',import.meta.url),'utf8');
const body=file.slice(file.indexOf('// Task 27: native 377'),file.indexOf('// The authoritative PAUSEBUTTON script'));
test('nearby observation reads existing ZoneMap; never allocates new zones',()=>{
 assert.match(body,/mapData\.zonemap\?\.zones/);
 assert.match(body,/existingZones\.get\(zoneIndex\)/);
 assert.doesNotMatch(body.replace(/\/\/[^\n]*/g,'').replace(/type ExistingZone[^\n]*/g,''),/gameMap\.getZone\(/);
 assert.match(body,/zone\.getAllLocsSafe\(\)/);
 assert.match(body,/zone\.getAllObjsSafe\(\)/);
});
test('strict scope prevents out-of-plane, far and foreign-player drops',()=>{
 assert.match(body,/loc\.level !== bot\.level \|\| distance > 16/);
 assert.match(body,/obj\.level !== bot\.level \|\| distance > 16/);
 assert.match(body,/!obj\.isValid\(bot\.hash64\)/);
 assert.match(body,/obj\.receiver64 !== Obj\.NO_RECEIVER && obj\.receiver64 !== bot\.hash64/);
 assert.match(body,/nearbyLocs\.length < 48/);
 assert.match(body,/groundItems\.length < 48/);
});
test('missing pinned ZoneMap internals stay explicitly unknown; no invented SDK state',()=>{
 assert.match(body,/let nearbyLocs: Array<Record<string, unknown>> \| null = null/);
 assert.match(body,/let groundItems: Array<Record<string, unknown>> \| null = null/);
 // Each quest stage is read ONLY from the current authenticated bot.
 // Missing config IDs must still fail closed; no guessed or injected stages.
 assert.match(file,/questStages: \(\(\) => \{/);
 for(const varp of ['barcrawl','cookquest','soulbane']) {
   assert.ok(file.includes("VarPlayerType.getId('"+varp+"')"));
 }
 for(const id of ['barcrawlId','cookId','soulbaneId']) {
   assert.ok(file.includes('bot.getVar('+id+')'));
 }
 assert.match(file,/barcrawlId < 0 \|\| cookId < 0 \|\| soulbaneId < 0/);
 assert.match(file,/\[barcrawl, cook, soulbaneRaw\]\.every\(Number\.isSafeInteger\)/);
 assert.match(file,/return \{ barcrawl, cook, soulbaneRaw \}/);
 assert.match(file,/combatEvents, prayers/);
 assert.match(file,/const shop = !shopOpen/);
 assert.match(file,/const bank = !bankOpen/);
});
