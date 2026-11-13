// Only stages a private, reviewable release. Never writes to the installed world.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const live='C:/JoshRS-Launcher/JoshRS-main';
const test='C:/JoshRS-TestWorlds/family-polish-20261113';
const active=JSON.parse(fs.readFileSync(path.join(live,'runtime/jparris-377/active.json'),'utf8').trimStart());
const out=path.join(test,'release');
if(fs.existsSync(out)) throw new Error('Release directory already exists; refusing overwrite.');
const hash=b=>createHash('sha256').update(b).digest('hex');
const files=[];
const changedSource=new Set(['joshrs_original/scripts/burgh_vilager_3.rs2','joshrs_original/scripts/peace_shirt_journal.rs2','joshrs_original/scripts/burgh_gate.rs2']);
function checkTree(from,to,kind,relative='') {
    for(const e of fs.readdirSync(from,{withFileTypes:true})) {
        if(e.isSymbolicLink()) throw new Error('Unexpected link in release source.');
        const name=relative?relative+'/'+e.name:e.name;
        if(e.isDirectory()) checkTree(path.join(from,e.name),path.join(to,e.name),kind,name);
        else {
            if(kind==='source' && !/\.(rs2|loc|varp|npc|obj|inv|if)$/.test(name)) continue;
            const data=fs.readFileSync(path.join(from,e.name));
            const old=fs.existsSync(path.join(to,e.name))?fs.readFileSync(path.join(to,e.name)):null;
            if(old && data.equals(old)) continue;
            if(kind==='source' && !changedSource.has(name)) throw new Error('Unapproved source drift: '+name);
            if(kind==='server' && !['script.dat','script.idx'].includes(name)) throw new Error('Unexpected server configuration drift: '+name);
            if(kind==='client') throw new Error('Client cache changed: '+name);
            files.push({kind,name,staged:path.join(from,e.name),target:path.join(to,e.name),before:old?hash(old):null,after:hash(data)});
        }
    }
}
checkTree(path.join(test,'content/scripts'),path.join(active.content,'scripts'),'source');
checkTree(path.join(test,'engine/data/pack/server'),path.join(active.engine,'data/pack/server'),'server');
checkTree(path.join(test,'engine/data/pack/client'),path.join(active.engine,'data/pack/client'),'client');
for(const name of fs.readdirSync(path.join(test,'content/pack'))) {
    const staged=path.join(test,'content/pack',name),target=path.join(active.content,'pack',name);
    if(!fs.statSync(staged).isFile()) continue;
    const data=fs.readFileSync(staged),old=fs.readFileSync(target);
    if(data.equals(old)) continue;
    if(name!=='script.pack') throw new Error('Unexpected registry drift: '+name);
    files.push({kind:'registry',name,staged,target,before:hash(old),after:hash(data)});
}
if(files.filter(f=>f.kind==='source').length!==3 || files.filter(f=>f.kind==='server').length!==2) throw new Error('Expected exactly three source files and two script pack files.');
fs.mkdirSync(out);
for(let i=0;i<files.length;i++) {
    fs.copyFileSync(files[i].staged,path.join(out,String(i)),fs.constants.COPYFILE_EXCL);
    files[i].payload=String(i);
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,created:new Date().toISOString(),files},null,2),{flag:'wx'});
console.log(JSON.stringify({release:out,files:files.map(({kind,name})=>({kind,name})),clientCacheUnchanged:true},null,2));
