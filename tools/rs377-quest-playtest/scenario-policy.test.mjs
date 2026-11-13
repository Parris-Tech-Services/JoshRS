import test from 'node:test';
import assert from 'node:assert/strict';
import { validateScenario, locClick, walkClick } from './scenario-policy.mjs';
test('normal action evidence refuses grants and teleports; assisted stays labelled', () => {
    assert.equal(validateScenario({ user: 'fixture', mode: 'normal', steps: [{ walk: [3485,3243] }, { talk: 'burgh_vilager_3' }] }), 'normal');
    for (const step of [{ cheat: 'give ball_of_wool 3' }, { tele: [0,3485,3245] }]) {
        assert.throws(() => validateScenario({ user: 'fixture', mode: 'normal', steps: [step] }), /cannot use/);
    }
    assert.equal(validateScenario({ user: 'fixture', steps: [{ tele: [0,3485,3245] }] }), 'assisted');
});
test('normal location and movement packets match pinned 377 decoder order and transforms', () => {
    const click = locClick(3485,3244,12816);
    assert.equal((click[0]<<8)|((click[1]-128)&255),3485);
    assert.equal(click.readUInt16LE(2),3244);
    assert.equal(click.readUInt16LE(4),12816);
    const walk = walkClick(3485,3243);
    assert.equal((walk[1]<<8)|((walk[0]-128)&255),3485);
    assert.equal(walk[2],0);
    assert.equal((walk[4]<<8)|((walk[3]-128)&255),3243);
});
