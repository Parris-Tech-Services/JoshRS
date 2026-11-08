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
 // The authenticated disposable bot now exposes only its own native
 // Barcrawl varp. Other unsupported SDK fields must still remain unknown.
 assert.match(file,/let nearbyLocs: Array<Record<string, unknown>> \\| null = null/);
 assert.match(file,/questStages: \\(\\(\\) => \\{/);
 assert.match(file,/VarPlayerType\\.getId\\('barcrawl'\\)/);
 assert.match(file,/if \\(barcrawlId < 0\\) return null/);
 assert.match(file,/bot\\.getVar\\(barcrawlId\\)/);
 assert.match(file,/Number\\.isSafeInteger\\(raw\\) && raw >= 0 \\? \\{ barcrawl: raw \\} : null/);
 assert.match(file,/combatEvents, prayers/);
 assert.match(file,/const shop = !shopOpen/);
 assert.match(file,/const bank = !bankOpen/);
});
