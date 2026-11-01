#!/usr/bin/env node
/**
 * Disposable #377 integration entrypoint. No automatic game/login launch.
 * An actual engine adapter must be installed by Agy in ./adapters/real377.mjs
 * after its origin and isolation have been reviewed.
 */
import {existsSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareDisposable,loadVerifiedManifest,runIsolatedIntegration} from './isolation.mjs';
const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const actualAdapter=path.join(packageRoot,'adapters/real377.mjs');
const argv=process.argv.slice(2);
function args(){
  const cmd=argv[0];
  if(!['--prepare','--verify','--run','--help'].includes(cmd)||argv.length>2||
    (cmd==='--prepare'&&argv.length!==1)||(cmd==='--help'&&argv.length!==1)||
    (['--verify','--run'].includes(cmd)&&argv.length!==2))
    throw Error('Usage: node src/run-integration.mjs --prepare | --verify MANIFEST | --run MANIFEST');
  return cmd;
}
try{
  const cmd=args();
  if(cmd==='--help'){
    process.stdout.write('Agy disposable #377 entrypoint: --prepare, --verify MANIFEST, --run MANIFEST\n'+
      'No production login, server startup, user saves or non-loopback connections.\n');
  }else if(cmd==='--prepare'){
    const {manifest,filename}=await prepareDisposable();
    process.stdout.write(JSON.stringify({status:'prepared_no_game_started',manifest:filename,
      worldId:manifest.worldId,ports:manifest.ports,account:manifest.account},null,2)+'\n');
  }else{
    const manifest=await loadVerifiedManifest(argv[1]);
    if(cmd==='--verify'){
      process.stdout.write(JSON.stringify({status:'isolated_manifest_verified_no_game_started',
        worldId:manifest.worldId,ports:manifest.ports,account:manifest.account},null,2)+'\n');
    }else{
      if(!existsSync(actualAdapter)||realpathSync(actualAdapter)!==actualAdapter)
        throw Error('BLOCKED: audited real native 377 adapter is not installed in adapters/real377.mjs');
      // The adapter file is source code and requires human/Agy code review first.
      const mod=await import(pathToFileURL(actualAdapter).href);
      if(typeof mod.createReal377Adapter!=='function')throw Error('Adapter export createReal377Adapter missing');
      const adapter=await mod.createReal377Adapter(manifest);
      const result=await runIsolatedIntegration({manifest,adapter});
      process.stdout.write(JSON.stringify(result,null,2)+'\n');
    }
  }
}catch(err){
  process.stderr.write('BLOCKED: '+err.message+'\n');
  process.exitCode=2;
}
