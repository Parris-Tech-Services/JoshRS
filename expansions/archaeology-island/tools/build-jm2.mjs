#!/usr/bin/env node
// Generates a complete 64x64 Lost City JM2 terrain SOURCE map. Does not change user runtime.
// Use: node tools/build-jm2.mjs <mapX 0..99> <mapZ 0..99> <outputFile> [--force]
// Coordinates must be assigned after verifying this square is not in active map.pack.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const argv=process.argv.slice(2);
if(argv.length<3) { console.error('Usage: node tools/build-jm2.mjs mapX mapZ output.jm2 [--force]'); process.exit(2); }
const [xs,zs,out]=argv;
const mx=Number(xs),mz=Number(zs);
assert(Number.isSafeInteger(mx)&&mx>=0&&mx<100,'map X must be integer 0..99');
assert(Number.isSafeInteger(mz)&&mz>=0&&mz<100,'map Z must be integer 0..99');
const expected='m'+mx+'_'+mz+'.jm2';
assert(path.basename(out)===expected,'Expected output filename '+expected);
if(fs.existsSync(out)&&!argv.includes('--force'))throw Error('Refusing overwrite of existing map: '+out);
const root=path.resolve(import.meta.dirname,'..');
const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
assert.equal(m.tiles.width,16);
assert.equal(m.tiles.height,16);
const legend=m.tiles.legend;
const terrain={ '~':{underlay:1,flags:1},'.':{underlay:2,flags:0},g:{underlay:3,flags:0},p:{underlay:2,flags:0},'#':{underlay:4,flags:1},D:{underlay:2,flags:0},C:{underlay:2,flags:0},X:{underlay:2,flags:0},T:{underlay:3,flags:0},R:{underlay:4,flags:0},E:{underlay:2,flags:0}};
for(const k of Object.keys(terrain))assert(k in legend,'Missing terrain legend key: '+k);
assert.equal(m.tiles.rows.length,16);
for(const line of m.tiles.rows)assert.equal(line.length,16);
// The island source is centred in the square, with safe water border.
const lines=['==== MAP ===='];
for(let x=0;x<64;x++)for(let z=0;z<64;z++){
 const ix=x-24, iz=z-24;
 const key=ix>=0&&ix<16&&iz>=0&&iz<16?m.tiles.rows[15-iz][ix]:'~';
 const t=terrain[key];assert(t,'Invalid terrain symbol '+key);
 // Underlay IDs are placeholders; MUST be resolved against active 377 flo definitions before actual packing.
 lines.push('0 '+x+' '+z+': h0 u'+t.underlay+' f'+t.flags);
}
lines.push('==== LOC ====', '==== NPC ====', '==== OBJ ====', '');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,lines.join('\n'));
console.log('Wrote source JM2 '+out+' (4096 MAP records, no unvalidated loc/NPC/OBJ IDs).');
console.log('NOT PACK-READY: underlay IDs, collision flags, cache map.pack entry and coordinate allocation require runtime verification.');
