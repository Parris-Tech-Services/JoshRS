/**
 * Original read-only revision 377 JM2 map inspector.
 * No external dependencies, cache mutation, or upstream assets.
 */
const HEADING=/^==== (MAP|LOC|NPC|OBJ) ====$/
const LINE=/^([0-3]) ([0-9]{1,2}) ([0-9]{1,2}): (.+)$/
const TOKEN=/^(?:h-?\d+|u\d+|o\d+(?:;\d+(?:;\d+)?)?|f\d+)$/
const NUMS=/^\d+(?: \d+)*$/
const key=(plane,x,z)=>[plane,x,z].join(':')
function hist(items) {
 const counts=new Map()
 for(const x of items)counts.set(x.id,(counts.get(x.id)||0)+1)
 return [...counts].sort(([a],[b])=>a-b).map(([id,count])=>({id,count}))
}
function decodeEntry(section,data,n) {
 if(!NUMS.test(data))throw Error('Line '+n+': malformed '+section+' definition')
 const values=data.split(' ').map(Number)
 const allowed=section==='LOC'?(values.length>=1&&values.length<=3):section==='OBJ'?values.length===2:values.length===1
 if(!allowed || values.some(x=>!Number.isSafeInteger(x)))throw Error('Line '+n+': invalid '+section+' entry')
 return {id:values[0],shape:section==='LOC'?(values[1]??10):null,orientation:section==='LOC'?(values[2]??0):null,count:section==='OBJ'?values[1]:1}
}
export function parseJm2(text,name='map.jm2') {
 if(typeof text!=='string'||text.length>2500000)throw Error('Expected UTF-8 JM2 text smaller than 2.5 MB')
 let section=null,n=0
 const found=new Set(),tiles=new Map(),locs=[],npcs=[],objects=[]
 for(const row of text.split(/\r?\n/)) {
   n++
   const line=row.trim()
   if(!line||line.startsWith('//')||line.startsWith('#'))continue
   const h=HEADING.exec(line)
   if(h){section=h[1];if(found.has(section))throw Error('Line '+n+': repeated '+section);found.add(section);continue}
   if(!section)throw Error('Line '+n+': missing section header')
   const m=LINE.exec(line)
   if(!m)throw Error('Line '+n+': malformed '+section+' record')
   const plane=+m[1],x=+m[2],z=+m[3],data=m[4]
   if(x>63||z>63)throw Error('Line '+n+': coordinate outside 64x64 region')
   if(section==='MAP'){
     const pos=key(plane,x,z)
     if(tiles.has(pos))throw Error('Line '+n+': repeated terrain tile '+pos)
     const tile={plane,x,z,underlay:null,overlay:null,height:null,flags:0,shape:0,rotation:0}
     for(const t of data.split(/\s+/)){
       if(!TOKEN.test(t))throw Error('Line '+n+': bad MAP token '+t)
       if(t[0]==='h')tile.height=+t.slice(1)
       if(t[0]==='u')tile.underlay=+t.slice(1)
       if(t[0]==='f')tile.flags=+t.slice(1)
       if(t[0]==='o'){const [id,shape=0,rotation=0]=t.slice(1).split(';').map(Number);tile.overlay=id;tile.shape=shape;tile.rotation=rotation}
     }
     tiles.set(pos,tile)
   }else{
     const obj={plane,x,z,...decodeEntry(section,data,n)}
     if(section==='LOC')locs.push(obj)
     if(section==='NPC')npcs.push(obj)
     if(section==='OBJ')objects.push(obj)
   }
 }
 if(!found.has('MAP'))throw Error('No MAP section found')
 const region=/^m(\d+)_(\d+)\.jm2$/.exec(name)
 const all=[...tiles.values()]
 return {name:name.replace(/[^a-zA-Z0-9_.-]/g,'').slice(0,120),region:region?{x:+region[1],z:+region[2]}:null,tiles,locs,npcs,objects,
   stats:{tiles:tiles.size,locations:locs.length,npcs:npcs.length,groundItems:objects.length,
     floors:hist(all.filter(t=>t.underlay!==null).map(t=>({id:t.underlay}))),
     overlays:hist(all.filter(t=>t.overlay!==null).map(t=>({id:t.overlay}))),
     uniqueLocIds:new Set(locs.map(x=>x.id)).size,
     planes:[...new Set(all.map(t=>t.plane))].sort()}}
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
function locIndex(items){
 const m=new Map()
 for(const item of items){
   const pos=key(item.plane,item.x,item.z)
   if(!m.has(pos))m.set(pos,[])
   m.get(pos).push([item.id,item.shape,item.orientation])
 }
 for(const row of m.values())row.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
 return m
}
export function diffJm2(a,b){
 const changes=[]
 for(const k of new Set([...a.tiles.keys(),...b.tiles.keys()])){
   const before=a.tiles.get(k)??null,after=b.tiles.get(k)??null
   if(!same(before,after))changes.push({key:k,before,after})
 }
 const left=locIndex(a.locs),right=locIndex(b.locs),locChanges=[]
 for(const k of new Set([...left.keys(),...right.keys()]))
   if(!same(left.get(k)??[],right.get(k)??[]))locChanges.push(k)
 return {changedTiles:changes.length,changedLocations:locChanges.length,tiles:changes,locationKeys:locChanges}
}
export function parsePack(text){
 const m=new Map()
 for(const line of text.split(/\r?\n/)){
   const match=/^(\d+)=(\S+)\s*$/.exec(line)
   if(match)m.set(+match[1],match[2])
 }
 return m
}
export function missingReferences(map,flo,loc,npc){
 return {floors:map.stats.floors.filter(x=>!flo.has(x.id)),overlays:map.stats.overlays.filter(x=>!flo.has(x.id)),
   locations:hist(map.locs).filter(x=>!loc.has(x.id)),npcs:hist(map.npcs).filter(x=>!npc.has(x.id))}
}
