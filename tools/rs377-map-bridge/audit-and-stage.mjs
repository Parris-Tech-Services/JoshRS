#!/usr/bin/env node
// Offline JoshRS 377 map audit. Reads old-cache .gz and matching content/*.pack.
// Stage-only: NEVER edits the active world, index4 archives or player saves.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function pack(file){
  const entries=new Map();
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const m=/^(\d+)=(\S+)$/.exec(line.trim());
    if(m)entries.set(Number(m[1]),m[2]);
  }
  if(!entries.size)throw Error('Empty pack: '+file);
  return entries;
}
function terrain(b){
  let pos=0, records=[], ids=new Set();
  for(let level=0;level<4;level++)for(let x=0;x<64;x++)for(let z=0;z<64;z++){
    const tok=[];
    for(;;){
      if(pos>=b.length)throw Error('Truncated terrain at '+level+','+x+','+z);
      const op=b[pos++];
      if(op===0)break;
      if(op===1){if(pos>=b.length)throw Error('Truncated height');tok.push('h'+b[pos++]);break;}
      if(op<=49){
        if(pos>=b.length)throw Error('Truncated overlay');
        const id=b[pos++],s=(op-2)>>2,r=(op-2)&3;ids.add(id);
        tok.push('o'+id+(s||r?';'+s+';'+r:''));
      }else if(op<=81){tok.push('f'+(op-49));}
      else{const id=op-81;ids.add(id);tok.push('u'+id);}
    }
    if(tok.length)records.push(level+' '+x+' '+z+': '+tok.join(' '));
  }
  if(pos!==b.length)throw Error('Unexpected trailing terrain bytes: '+(b.length-pos));
  return {records,ids};
}
function locs(b){
  let p=0,id=-1; const records=[],byId=new Map();
  function smart(){
    if(p>=b.length)throw Error('Truncated loc smart');
    if(b[p]<128)return b[p++];
    if(p+1>=b.length)throw Error('Truncated loc two-byte smart');
    return ((b[p++]<<8)|b[p++])-32768;
  }
  for(;;){
    const delta=smart(); if(delta===0)break;
    id+=delta;let tile=0;
    for(;;){
      const step=smart();if(step===0)break;
      tile+=step-1;
      if(p>=b.length)throw Error('Truncated loc orientation');
      const info=b[p++],level=tile>>12,x=(tile>>6)&63,z=tile&63;
      if(level>3)throw Error('Invalid loc plane '+level);
      records.push(level+' '+x+' '+z+': '+id+' '+(info>>2)+' '+(info&3));
      byId.set(id,(byId.get(id)||0)+1);
    }
  }
  return {records,byId,trailing:b.length-p,trailingNonZero:b.subarray(p).filter(x=>x!==0).length};
}
function main(args){
  if(args.length<3||args.length>4)throw Error('Usage: node audit-and-stage.mjs <content-root> <extracted-gz-folder> <report.json> [stage-dir]');
  const [contentRoot,archiveDir,reportPath,stage]=args;
  const prefix=path.join(contentRoot,'pack');
  const maps=pack(path.join(prefix,'map.pack')), floors=pack(path.join(prefix,'flo.pack')), config=pack(path.join(prefix,'loc.pack'));
  if(fs.existsSync(reportPath))throw Error('Refusing to overwrite report: '+reportPath);
  const ids=fs.readdirSync(archiveDir).filter(x=>/^\d+\.gz$/.test(x)).map(x=>Number(x.slice(0,-3)));
  const groups=new Map(), warnings=[];
  for(const id of ids){
    const name=maps.get(id),match=name&&/^([ml])(\d+)_(\d+)$/.exec(name);
    if(!match){warnings.push('Unmapped cache index '+id);continue;}
    const square=match[2]+'_'+match[3];
    if(!groups.has(square))groups.set(square,{});
    groups.get(square)[match[1]]=id;
  }
  const report={status:'AUDIT_ONLY',safeToInstall:false,reason:'Cache/schema/collision/asset verification still required',warnings,regions:[]};
  for(const [square,files] of groups){
    const result={square,cacheIds:files,safeToInstall:false,errors:[]};report.regions.push(result);
    if(files.m===undefined||files.l===undefined){result.errors.push('Missing paired terrain/objects');continue;}
    try{
      const tile=terrain(zlib.gunzipSync(fs.readFileSync(path.join(archiveDir,files.m+'.gz'))));
      const objs=locs(zlib.gunzipSync(fs.readFileSync(path.join(archiveDir,files.l+'.gz'))));
      const bad=[...objs.byId].filter(([id])=>!config.has(id));
      const unknownFloors=[...tile.ids].filter(id=>!floors.has(id));
      result.terrainRecords=tile.records.length;result.objectCount=objs.records.length;
      result.unsupportedLocIdCount=bad.length;result.unsupportedLocInstances=bad.reduce((s,[,n])=>s+n,0);
      result.unsupportedExamples=bad.sort((a,b)=>b[1]-a[1]).slice(0,12);
      result.unknownFloors=unknownFloors;result.trailingLocBytes=objs.trailing;
      if(bad.length)result.errors.push('Undefined 377 location IDs');
      if(unknownFloors.length)result.errors.push('Undefined 377 floors');
      if(objs.trailing)result.errors.push('Unparsed loc data remaining: '+objs.trailing+' bytes');
      if(stage){
        const output=path.resolve(stage,'m'+square+'.jm2');
        if(fs.existsSync(output))throw Error('Refusing overwrite: '+output);
        fs.mkdirSync(path.dirname(output),{recursive:true});
        fs.writeFileSync(output,['==== MAP ====',...tile.records,'==== LOC ====',...objs.records,'==== NPC ====','==== OBJ ====',''].join('\n'));
        result.stageOnly=output;
      }
    }catch(e){result.errors.push(e.message);}
  }
  fs.mkdirSync(path.dirname(path.resolve(reportPath)),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  for(const r of report.regions)console.log(r.square+' terrain '+r.terrainRecords+' locs '+r.objectCount+' unsupported '+r.unsupportedLocInstances+' errors '+r.errors.join(' | '));
  console.log('Report:',reportPath,' (not safe to install).');
}
try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
