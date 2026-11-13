import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {applyGate,verifyRegistry} from './apply.mjs';
const pack='12816=burgh_fencegate_l\n12817=burgh_fencegate_r\n12818=burgh_openfencegate_l\n12819=burgh_openfencegate_r\n';
test('drift and duplicate handlers refused; dry run read-only; script install idempotent',t=>{
    assert.throws(()=>verifyRegistry(pack.replace('12816=','999=')),/registry/);
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'burgh-gate-'));
    t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    fs.mkdirSync(path.join(root,'scripts'));fs.mkdirSync(path.join(root,'pack'));
    fs.writeFileSync(path.join(root,'pack/loc.pack'),pack);
    const options={launcherRoot:path.join(root,'unused')};
    assert.equal(applyGate(root,options).changed,true);
    assert.deepEqual(fs.readdirSync(path.join(root,'scripts')),[]);
    assert.equal(applyGate(root,{...options,apply:true}).changed,true);
    assert.equal(applyGate(root,{...options,apply:true}).changed,false);
    assert.equal(fs.readFileSync(path.join(root,'pack/loc.pack'),'utf8'),pack);
    fs.writeFileSync(path.join(root,'scripts/conflict.rs2'),'[oploc1,burgh_fencegate_r]\n');
    assert.throws(()=>applyGate(root,options),/Existing gate handler/);
});
test('active runtime refused',t=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'burgh-active-'));
    t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    fs.mkdirSync(path.join(root,'runtime/jparris-377'),{recursive:true});
    fs.writeFileSync(path.join(root,'runtime/jparris-377/active.json'),JSON.stringify({content:root}));
    assert.throws(()=>applyGate(root,{launcherRoot:root,apply:true}),/active family/);
});
