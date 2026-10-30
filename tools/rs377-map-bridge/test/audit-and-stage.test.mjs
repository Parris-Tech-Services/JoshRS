import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {spawnSync} from 'node:child_process';

test('377 offline bridge stages a synthetic region without modifying existing caches', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-map-test-'));
  try {
    const content=path.join(root,'content');
    const pack=path.join(content,'pack');
    const gz=path.join(root,'input');
    fs.mkdirSync(pack,{recursive:true});fs.mkdirSync(gz);
    fs.writeFileSync(path.join(pack,'map.pack'),'624=m48_54\n625=l48_54\n');
    fs.writeFileSync(path.join(pack,'loc.pack'),'2=test_location\n');
    fs.writeFileSync(path.join(pack,'flo.pack'),'0=cliff\n');
    fs.writeFileSync(path.join(gz,'624.gz'),zlib.gzipSync(Buffer.alloc(64*64*4)));
    fs.writeFileSync(path.join(gz,'625.gz'),zlib.gzipSync(Buffer.from([3,1,40,0,0])));
    const report=path.join(root,'result.json'),stage=path.join(root,'stage');
    const run=spawnSync(process.execPath,[new URL('../audit-and-stage.mjs',import.meta.url).pathname,content,gz,report,stage],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const json=JSON.parse(fs.readFileSync(report,'utf8'));
    assert.equal(json.safeToInstall,false);
    assert.equal(json.regions[0].terrainRecords,0);
    assert.equal(json.regions[0].objectCount,1);
    assert.equal(json.regions[0].unsupportedLocInstances,0);
    assert.deepEqual(json.regions[0].errors,[]);
    assert.match(fs.readFileSync(path.join(stage,'m48_54.jm2'),'utf8'),/0 0 0: 2 10 0/);
    assert.equal(fs.readFileSync(path.join(pack,'loc.pack'),'utf8'),'2=test_location\n');
    const again=spawnSync(process.execPath,[new URL('../audit-and-stage.mjs',import.meta.url).pathname,content,gz,report,stage],{encoding:'utf8'});
    assert.notEqual(again.status,0,'prevents replacement of existing reports and map output');
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
