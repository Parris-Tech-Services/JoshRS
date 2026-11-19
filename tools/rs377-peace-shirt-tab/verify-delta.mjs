import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const root='C:/JoshRS-TestWorlds/family-polish-20261113';
const pack=fs.readFileSync(path.join(root,'content/pack/interface.pack'),'utf8');
const idOf=name=>Number(pack.match(new RegExp(`^(\\d+)=${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\r?$`,'m'))?.[1]);
const container=idOf('questlist:com_0'),rootId=idOf('questlist');
assert.ok(Number.isInteger(container)&&Number.isInteger(rootId));
const before=JSON.parse(fs.readFileSync(path.join(root,'engine/quest-tab-candidate/baseline-components.json')));
const after=JSON.parse(fs.readFileSync(path.join(root,'engine/quest-tab-candidate/custom-components.json')));
for(let id=0;id<before.length;id++) {
    if(!before[id]) {assert.equal(after[id]??null,null);continue;}
    if(id!==container) {assert.deepEqual(after[id],before[id],`Existing component ${id} changed unexpectedly.`);continue;}
    const expected=structuredClone(before[id]);
    expected.scroll+=20;
    const count=Object.keys(expected.childId).length;
    for(const key of Object.keys(expected.childY)) expected.childY[key]=(expected.childY[key]+20)&65535;
    expected.childId[count]=18786;expected.childX[count]=10;expected.childY[count]=8;
    assert.deepEqual(after[id],expected,'Quest-list parent has changes beyond the added row and 20px space.');
}
assert.equal(after.filter(Boolean).length,before.filter(Boolean).length+1);
const row=after[18786];
assert.equal(row.rootLayer,rootId);
assert.equal(row.comType,4);assert.equal(row.buttonType,1);
assert.equal(row.text,'The Peace Shirt');
console.log(JSON.stringify({verified:true,newRow:18786,existingComponentsPreserved:before.filter(Boolean).length,shiftedContainer:container,extraScroll:20}));
