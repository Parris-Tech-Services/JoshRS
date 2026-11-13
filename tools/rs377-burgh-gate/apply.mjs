import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export function verifyRegistry(pack) {
    ['burgh_fencegate_l','burgh_fencegate_r','burgh_openfencegate_l','burgh_openfencegate_r'].forEach((name,i)=>{
        if(!new RegExp(`^${12816+i}=${name}\\r?$`,'m').test(pack)) throw new Error('Unexpected 377 gate registry.');
    });
}
export function applyGate(content,{apply=false,launcherRoot='C:\\JoshRS-Launcher\\JoshRS-main'}={}) {
    const root=fs.realpathSync(content);
    const state=path.join(launcherRoot,'runtime/jparris-377/active.json');
    if(fs.existsSync(state)) {
        const active=JSON.parse(fs.readFileSync(state,'utf8').trimStart());
        if(fs.realpathSync(active.content).toLowerCase()===root.toLowerCase()) throw new Error('Refusing active family world. Use a separate test copy.');
    }
    verifyRegistry(fs.readFileSync(path.join(root,'pack/loc.pack'),'utf8'));
    const file=path.join(root,'scripts/joshrs_original/scripts/burgh_gate.rs2');
    const script=fs.readFileSync(path.join(here,'burgh_gate.rs2'));
    function walk(dir) {
        for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
            const p=path.join(dir,e.name);
            if(e.isSymbolicLink()) throw new Error('Refusing linked script tree.');
            if(e.isDirectory()) walk(p);
            else if(e.name.endsWith('.rs2') && p!==file && /\[oploc1,burgh_fencegate_[lr]\]/.test(fs.readFileSync(p,'utf8'))) throw new Error('Existing gate handler: '+p);
        }
    }
    walk(path.join(root,'scripts'));
    if(fs.existsSync(file) && !fs.readFileSync(file).equals(script)) throw new Error('Existing different gate script.');
    const plan={dryRun:!apply,changed:!fs.existsSync(file),file};
    if(apply && plan.changed) { fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,script,{flag:'wx'}); }
    return plan;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
    try { const i=process.argv.indexOf('--content'); if(i<0||!process.argv[i+1]) throw new Error('Provide --content <disposable content> [--apply]'); console.log(JSON.stringify(applyGate(process.argv[i+1],{apply:process.argv.includes('--apply')}),null,2)); }
    catch(error) { console.error(error.message); process.exitCode=1; }
}
