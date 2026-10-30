#!/usr/bin/env node
// Tideglass: generates a 377-wip Lost City JM2 map SOURCE (not packed client data).
// Verified against actual user's flo.pack, map.pack and m57_55.jm2 2026-10-30.
// Usage: node tools/build-jm2.mjs <mapX> <mapZ> <output mX_Z.jm2> <flo.pack> <map.pack>
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const [xs,zs,out,floPath,mapPath] = process.argv.slice(2);
if(!mapPath)throw Error('Usage: node tools/build-jm2.mjs mapX mapZ output.jm2 flo.pack map.pack');
const x=Number(xs),z=Number(zs);
assert(Number.isSafeInteger(x)&&x>=0&&x<=255,'map X must be 0..255');
assert(Number.isSafeInteger(z)&&z>=0&&z<=255,'map Z must be 0..255');
assert.equal(path.basename(out),'m'+x+'_'+z+'.jm2','Output must match map square coordinates');
assert(!fs.existsSync(out),'Refusing to overwrite existing file');
const floors=new Map();
for(const line of fs.readFileSync(floPath,'utf8').split(/\r?\n/)){
 const match=/^(\d+)=(\S+)\s*$/.exec(line.trim());
 if(match)floors.set(match[2],Number(match[1]));
}
for(const required of ['water','sandfloor','grass','road','cliff'])assert(floors.has(required),'Missing floor definition: '+required);
const entries=fs.readFileSync(mapPath,'utf8').split(/\r?\n/).map(s=>s.trim());
for(const name of ['m'+x+'_'+z,'l'+x+'_'+z]){
 assert(!entries.some(s=>s.split('=')[1]===name),'Mapsquare already exists in current pack: '+name);
}
const base=path.resolve(import.meta.dirname,'..');
const m=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
assert.equal(m.tiles.rows.length,16,'Expected 16 source rows');
const floorBySymbol={'~':'water','.':'sandfloor',g:'grass',p:'road','#':'cliff',D:'sandfloor',C:'sandfloor',X:'sandfloor',T:'grass',R:'cliff',E:'sandfloor'};
for(const [key,val] of Object.entries(floorBySymbol)){
 assert(key in m.tiles.legend,'Missing legend: '+key);
 assert(floors.has(val),'Floor not found: '+val);
}
const lines=['==== MAP ===='];
for(let tx=0;tx<64;tx++)for(let tz=0;tz<64;tz++){
 const gx=tx-24,gz=tz-24;
 const symbol=(gx>=0&&gx<16&&gz>=0&&gz<16)?m.tiles.rows[15-gz][gx]:'~';
 const floor=floors.get(floorBySymbol[symbol]);
 assert(Number.isSafeInteger(floor),'Invalid symbol: '+symbol);
 // Collision/water blocking and precise heights need a runtime proof before installation.
 lines.push('0 '+tx+' '+tz+': h0 u'+floor);
}
lines.push('==== LOC ====', '==== NPC ====', '==== OBJ ====', '');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,lines.join('\n'));
console.log(JSON.stringify({source:'377-jm2',output:out,square:[x,z],landRecords:4096,validatedFloorNames:[...new Set(Object.values(floorBySymbol))],claim:'source-only; requires registered map archive, collision, models, scripts and live test'},null,2));
