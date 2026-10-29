import fs from 'node:fs';
import path from 'node:path';
import { createDefaultWorldConfig, saveWorldConfig } from './src/util/WorldConfig.ts';
const data = path.resolve(process.env.JOSHRS_DATA_DIR || '/data');
fs.mkdirSync(data, {recursive:true});
for (const [target, name] of [['db.sqlite','db.sqlite'], ['data/players','players']]) {
  const dest=path.join(data,name);
  if(name==='players') fs.mkdirSync(dest,{recursive:true});
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const existing=fs.lstatSync(target,{throwIfNoEntry:false});
  if(existing && (!existing.isSymbolicLink() || path.resolve(path.dirname(target),fs.readlinkSync(target))!==dest)) throw new Error(`Refusing to replace existing ${target}`);
  if(!existing) fs.symlinkSync(dest,target);
}
const c=createDefaultWorldConfig();
c.easyStartup=true;
c.login.enabled=true;
c.friend.enabled=true;
c.logger.enabled=true;
c.node.production=true;
c.node.debug=false;
c.node.maxConnected=25;
c.build.liveReload=false;
c.web.port=Number(process.env.PORT || 8888);
c.web.allowedOrigin=process.env.JOSHRS_ORIGIN || 'http://localhost:8888';
if(!Number.isInteger(c.web.port)||c.web.port<1||c.web.port>65535) throw new Error('Invalid PORT');
new URL(c.web.allowedOrigin);
saveWorldConfig(c);
