// Scope the build to the authored interface and server scripts. Rebuilding all
// historic config/model packs is neither needed nor allowed for a text-only row.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const engine=fs.realpathSync(process.argv[2]??'C:/JoshRS-TestWorlds/family-polish-20261113/engine');
if(!engine.toLowerCase().replaceAll('\\','/').startsWith('c:/joshrs-testworlds/')) throw new Error('Build a disposable world only.');
process.chdir(engine);
const load=async(p:string)=>import(pathToFileURL(path.join(engine,p)).href);
const {default:Environment}=await load('src/util/Environment.ts');
if(!Environment.BUILD_VERIFY) throw new Error('BUILD_VERIFY must remain enabled.');
const hash=(f:string)=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const protectedFiles:string[]=[];
function walk(dir:string) {for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(!f.endsWith('/interface')&&!f.endsWith('\\interface'))protectedFiles.push(f);}}
walk('data/pack/client');
for(const f of fs.readdirSync('data/pack/server')) if(!['script.dat','script.idx','interface.dat'].includes(f)) protectedFiles.push(path.join('data/pack/server',f));
const before=new Map(protectedFiles.map(f=>[f,hash(f)]));
const {revalidatePack}=await load('tools/pack/PackFile.ts');
await revalidatePack();
const {default:FileStream}=await load('src/io/FileStream.ts');
const {packClientInterface}=await load('tools/pack/interface/PackClient.ts');
const {runServerCompiler}=await load('tools/pack/Compiler.ts');
const cache=new FileStream('data/pack');
packClientInterface(cache,[]);
runServerCompiler();
for(const [f,expected]of before) if(hash(f)!==expected) throw new Error('Unrelated packed file changed: '+f);
console.log(JSON.stringify({verified:true,scope:'quest interface and scripts',unrelatedPackedFilesPreserved:before.size,interfaceSHA256:hash('data/pack/client/interface'),scriptSHA256:hash('data/pack/server/script.dat')}));
