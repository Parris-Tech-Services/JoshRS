import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectSave } from './inspect-save.mjs';
import { inspectAccountDb } from './inspect-account-db.mjs';

export function validateFamilyWorld(engine) {
    const root=fs.realpathSync(engine);
    const folder=path.join(root,'data/players');
    const saves=[];
    function walk(dir) {
        if(!fs.existsSync(dir)) return;
        for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
            const file=path.join(dir,e.name);
            if(e.isSymbolicLink()) throw new Error('Save tree contains a link. Refusing to validate a shared save tree.');
            if(e.isDirectory()) walk(file);
            else if(e.name.endsWith('.sav')) { inspectSave(fs.readFileSync(file)); saves.push(file); }
        }
    }
    walk(folder);
    const database=path.join(root,'db.sqlite');
    if(saves.length && !fs.existsSync(database)) throw new Error('Character saves exist without their account database.');
    let sqliteVerified=false,familyAccountsVerified=0;
    if(fs.existsSync(database)) {
        sqliteVerified=inspectAccountDb(database).sqliteVerified;
        for(const user of ['elrothiro','sylvie']) {
            if(saves.some(file=>path.basename(file).toLowerCase()===user+'.sav')) {
                if(!inspectAccountDb(database,user).characterAccountPresent) throw new Error('An existing family character has no matching login record.');
                familyAccountsVerified++;
            }
        }
    }
    return {valid:true,savesVerified:saves.length,sqliteVerified,familyAccountsVerified};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
    try { if(!process.argv[2]) throw new Error('Provide the engine directory.'); console.log(JSON.stringify(validateFamilyWorld(process.argv[2]))); }
    catch(error) { console.error('World validation failed: '+error.message);process.exitCode=1; }
}
