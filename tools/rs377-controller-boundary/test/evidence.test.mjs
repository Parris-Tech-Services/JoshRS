import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEvidence} from '../lib/evidence.mjs';
const base={kind:'source',outcome:'pass',timestamp:'2026-11-02T00:00:00Z',sourceCommit:'a'.repeat(40),worldFingerprint:null,checks:[{name:'offline_tests',outcome:'pass'}]};
test('valid redacted source evidence accepted',()=>assert.equal(validateEvidence(base).outcome,'pass'));
test('secret-bearing extra fields rejected',()=>assert.throws(()=>validateEvidence({...base,password:'secret'}),/sensitive/));
test('same world requires both independent checks',()=>assert.throws(()=>validateEvidence({...base,kind:'same_world'}),/same_world_proof/));
test('gameplay requires observed persistence',()=>assert.throws(()=>validateEvidence({...base,kind:'gameplay'}),/gameplay_proof/));
test('pass cannot hide a failing check',()=>assert.throws(()=>validateEvidence({...base,checks:[{name:'offline_tests',outcome:'fail'}]}),/unsupported_pass/));
