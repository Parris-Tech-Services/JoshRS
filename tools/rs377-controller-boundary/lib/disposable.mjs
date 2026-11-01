import path from 'node:path';
/** Validates an isolated 377 test launch. Does NOT start any service. */
export function validateDisposable377(config){
 if(!config||typeof config!=='object'||Array.isArray(config))throw new Error('invalid_disposable_config');
 const keys=['host','gamePort','webPort','saveRoot','account','worldId','explicitDisposable'];
 if(Object.keys(config).some(k=>!keys.includes(k)))throw new Error('unexpected_config_field');
 if(config.host!=='127.0.0.1'&&config.host!=='::1')throw new Error('loopback_only');
 for(const [name,forbidden] of [['gamePort',[52402,8888,45099,43500]],['webPort',[52402,8888,45099,43500]]]){
  const n=config[name];if(!Number.isInteger(n)||n<1024||n>65535||forbidden.includes(n))throw new Error('unsafe_'+name);
 }
 if(config.gamePort===config.webPort)throw new Error('port_collision');
 if(config.explicitDisposable!==true||!/^isolated-[a-z0-9_-]{4,64}$/.test(config.worldId??''))throw new Error('disposable_world_required');
 if(typeof config.account!=='string'||!/^Fixture[A-Za-z0-9_]{3,10}$/.test(config.account))throw new Error('disposable_account_required');
 if(typeof config.saveRoot!=='string'||!path.isAbsolute(config.saveRoot)||config.saveRoot==='/'||/\b(JoshRS|jparris|family|production|saves|players)\b/i.test(config.saveRoot)||!/(?:^|[/\\])rs377-disposable-[a-z0-9_-]+$/i.test(config.saveRoot))throw new Error('disposable_save_root_required');
 return Object.freeze({...config});
}
