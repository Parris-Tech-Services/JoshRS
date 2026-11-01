import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRealGameplay} from '../lib/real-gameplay.mjs';
test('requires authoritative game evidence', () => assert.throws(() => evaluateRealGameplay({})));
