import test from 'node:test'
import assert from 'node:assert/strict'
import {parseJm2,diffJm2,parsePack,missingReferences} from '../jm2-inspector.mjs'
const baseline=[
'==== MAP ====',
'0 1 2: h13 o107;2;1 f1 u54',
'0 3 4: u5',
'1 2 3: o9;1 u48',
'==== LOC ====',
'0 1 2: 5328 22 2',
'0 1 2: 5329 22 3',
'==== NPC ====',
'0 3 4: 1698',
'==== OBJ ====',
'0 3 4: 123 2',
''
].join('\n')
test('parse 377 JM2 terrain with overlay rotations and native scenery definitions',()=>{
 const map=parseJm2(baseline,'m57_55.jm2')
 assert.deepEqual(map.region,{x:57,z:55})
 assert.equal(map.stats.tiles,3)
 assert.equal(map.stats.locations,2)
 assert.equal(map.stats.npcs,1)
 assert.equal(map.stats.groundItems,1)
 const terrain=map.tiles.get('0:1:2')
 assert.equal(terrain.underlay,54)
 assert.equal(terrain.overlay,107)
 assert.equal(terrain.shape,2)
 assert.equal(terrain.rotation,1)
 assert.equal(terrain.height,13)
 assert.equal(terrain.flags,1)
 assert.deepEqual(map.stats.planes,[0,1])
})
test('compare a changed tile and location while keeping duplicate placements',()=>{
 const edited=baseline.replace('h13 o107;2;1 f1 u54','h13 o107;2;1 f1 u55')
   .replace('0 1 2: 5329 22 3','0 1 2: 5330 22 3')
 const diff=diffJm2(parseJm2(baseline),parseJm2(edited))
 assert.equal(diff.changedTiles,1)
 assert.equal(diff.changedLocations,1)
 assert.deepEqual(diff.locationKeys,['0:1:2'])
 assert.equal(diff.tiles[0].before.underlay,54)
})
test('detect undefined floor, overlay, loc and npc IDs',()=>{
 const map=parseJm2(baseline)
 const missing=missingReferences(map,
  parsePack('5=water\n48=cliff\n'),parsePack('5328=stone\n'),parsePack('4=rat\n'))
 assert.deepEqual(missing.floors,[{id:54,count:1}])
 assert.deepEqual(missing.overlays,[{id:9,count:1},{id:107,count:1}])
 assert.deepEqual(missing.locations,[{id:5329,count:1}])
 assert.deepEqual(missing.npcs,[{id:1698,count:1}])
})
test('reject malformed, overlarge and out-of-bounds map records',()=>{
 assert.throws(()=>parseJm2('==== MAP ====\n0 64 0: u5'),/coordinate outside/)
 assert.throws(()=>parseJm2('==== LOC ====\n0 0 0: 10'),/No MAP section/)
 assert.throws(()=>parseJm2('==== MAP ====\n0 1 2: u5\n0 1 2: u6'),/repeated terrain/)
 assert.throws(()=>parseJm2('==== MAP ====\n0 1 2: command'),/bad MAP token/)
 assert.throws(()=>parseJm2('x'.repeat(2500001)),/2.5 MB/)
})
