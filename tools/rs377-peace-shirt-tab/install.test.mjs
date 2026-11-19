import test from 'node:test';
import assert from 'node:assert/strict';
import {patchList} from './install.mjs';
test('authored row gets space while native names, ordering and actions are preserved',()=>{
    const entries=Array.from({length:104},(_,i)=>`[quest_${i}]\nlayer=com_0\ntype=text\ny=${8+i*15}\ntext=Fixture ${i}\noption=Fixture ${i}\n`).join('\n');
    const source='[com_0]\ntype=layer\nscroll=1610\n\n'+entries;
    const result=patchList(source);
    assert.match(result,/scroll=1630/);assert.match(result,/\[peace_shirt\][\s\S]*text=The Peace Shirt/);
    for(let i=0;i<104;i++)assert.ok(result.includes(`[quest_${i}]\nlayer=com_0\ntype=text\ny=${28+i*15}\ntext=Fixture ${i}\noption=Fixture ${i}`));
    assert.throws(()=>patchList(result),/already has/);
    assert.throws(()=>patchList(source.replace('scroll=1610','scroll=9999')),/Unexpected/);
});
test('CRLF source remains structurally compatible',()=>{
    const entries=Array.from({length:100},(_,i)=>`[q${i}]\r\nlayer=com_0\r\ny=${i}\r\n`).join('\r\n');
    const result=patchList('[com_0]\r\nscroll=1610\r\n\r\n'+entries);
    assert.match(result,/\[peace_shirt\]\r\n/);
});
