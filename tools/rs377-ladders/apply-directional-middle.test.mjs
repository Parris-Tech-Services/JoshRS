import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { patchText, inspectTarget } from './apply-directional-middle.mjs';

const fixture = [
  '[oploc1,laddermiddle]', 'p_arrivedelay;',
  '[oploc2,laddermiddle]', 'p_arrivedelay;',
  '[oploc3,laddermiddle]', 'p_arrivedelay;',
  '[label,ladder_options]', 'if_close;',
  '[proc,climb_ladder]', 'p_telejump($coord);',
  '[oploc1,loc_1749]', 'p_arrivedelay;', ''
].join('\n');
const pack = '1748=laddermiddle\n1751=loc_1751\n';

test('1751 has three matching existing ladder operations', () => {
  const out = patchText(fixture, pack);
  assert.match(out, /\[oploc1,loc_1751\]\np_arrivedelay;\n@ladder_options/);
  assert.match(out, /\[oploc2,loc_1751\]\np_arrivedelay;\n~climb_ladder\(movecoord\(coord\(\), 0, 1, 0\), true\)/);
  assert.match(out, /\[oploc3,loc_1751\]\np_arrivedelay;\n~climb_ladder\(movecoord\(coord\(\), 0, -1, 0\), false\)/);
  assert.equal((out.match(/\[oploc[123],loc_1751\]/g)||[]).length,3);
  assert.throws(()=>patchText(out,pack),/already has a handler/);
});
test('fails closed on source/loc mapping mismatch', () => {
  assert.throws(()=>patchText(fixture,'1751=other\n1748=laddermiddle\n'),/Unexpected loc IDs/);
  assert.throws(()=>patchText(fixture.replace('[oploc1,loc_1749]','missing'),pack),/Source drift/);
});
test('dry run is read-only, and active world is forbidden even with --apply', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'joshrs-directional-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const clone=path.join(root,'clone');
  const live=path.join(root,'runtime','jparris-377','content');
  const source=path.join(clone,'scripts','ladders+stairs','scripts','ladders.rs2');
  fs.mkdirSync(path.dirname(source),{recursive:true});
  fs.mkdirSync(path.join(clone,'pack'),{recursive:true});
  fs.mkdirSync(live,{recursive:true});
  fs.writeFileSync(source,fixture);
  fs.writeFileSync(path.join(clone,'pack','loc.pack'),pack);
  fs.writeFileSync(path.join(root,'runtime','jparris-377','active.json'),JSON.stringify({content:live}));
  assert.equal(inspectTarget(root,clone).dryRun,true);
  assert.equal(fs.readFileSync(source,'utf8'),fixture);
  assert.throws(()=>inspectTarget(root,live,true),/REFUSED/);
  assert.equal(inspectTarget(root,clone,true).dryRun,false);
  assert.equal(fs.readFileSync(source+'.joshrs1751.original','utf8'),fixture);
  assert.match(fs.readFileSync(source,'utf8'),/\[oploc1,loc_1751\]/);
  assert.throws(()=>inspectTarget(root,clone,true),/already has a handler/);
});
