import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateHandoff } from './verify.mjs';

const file = new URL('../../docs/rs377/CURRENT_AGENT_CHECKPOINT_HANDOFF.md', import.meta.url);
const good = readFileSync(file, 'utf8');
const fails = (value, expected) => assert.ok(
  validateHandoff(value).some(reason => reason.includes(expected)),
  'expected failure containing ' + expected + ', got ' + JSON.stringify(validateHandoff(value))
);

test('current canonical handoff includes baseline, evidence, conservative acceptance, ownership and action', () => {
  assert.deepEqual(validateHandoff(good), []);
});
test('missing evidence table is rejected', () => {
  fails(good.replace('## Implemented and evidenced', '## Notes'), 'Missing section');
});
test('fabricated same-world acceptance is rejected', () => {
  fails(good.replace('same-world Elrothiro bot **UNVERIFIED**', 'same-world Elrothiro bot **VERIFIED COMPLETE**'), 'Live success incorrectly claimed');
});
test('missing verified main baseline is rejected', () => {
  fails(good.replace(/main\\` baseline/, 'source baseline').replace(/main\` baseline/, 'source baseline'), 'baseline main SHA');
});
test('lack of Agy read-only shell command is rejected', () => {
  const start = good.indexOf('## Next local action');
  const end = good.indexOf('## Checkpoint update protocol', start);
  const changed = good.slice(0, start) + '## Next local action\nDo the thing.\n\n' + good.slice(end);
  fails(changed, 'Next local action lacks an executable shell command');
});
test('absence of five-state verdicts is rejected', () => {
  fails(good.replace('**Separate five-state acceptance verdicts:**', '**Status:**'), 'Missing five-way acceptance verdict');
});
test('deleting all CI run links is rejected', () => {
  fails(good.replaceAll('https://github.com/Parris-Tech-Services/JoshRS/actions/runs/', 'https://example.invalid/actions/runs/'), 'CI run evidence');
});
