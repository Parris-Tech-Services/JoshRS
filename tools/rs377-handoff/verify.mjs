#!/usr/bin/env node
// Source-only contract validation. Does not query a game server or infer live success.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const defaultFile = fileURLToPath(new URL('../../docs/rs377/CURRENT_AGENT_CHECKPOINT_HANDOFF.md', import.meta.url));

export function validateHandoff(body) {
  const errors = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  check(typeof body === 'string' && body.length >= 1000, 'Missing or unusually short handoff');
  if (typeof body !== 'string') return errors;

  for (const heading of [
    '## Implemented and evidenced',
    '## Known defects and unverified gates',
    '## Ownership and next actions',
    '## Next local action',
    '## Checkpoint update protocol',
  ]) check(body.includes(heading), 'Missing section: ' + heading);

  const baseline = body.match(/main[^\n]{0,100}baseline[^\n]{0,260}/i)?.[0] || '';
  check(/[a-f0-9]{40}/.test(baseline), 'No full 40-hex baseline main SHA');
  check(/github\.com\/Parris-Tech-Services\/JoshRS\/commit\/[a-f0-9]{40}/.test(body),
    'Missing exact commit URL');
  check(/github\.com\/Parris-Tech-Services\/JoshRS\/actions\/runs\/\d{8,}/.test(body),
    'Missing named CI run evidence');
  check(/\b(npm|node|bash|git)\s+(?:run|--test|--check|status|rev-parse|tools\/)/.test(body),
    'Missing runnable verification command');
  check(/PARTIALLY COMPLETE|BLOCKED|UNVERIFIED/.test(body), 'Missing explicit acceptance boundary');
  check(/ChatGPT[\s\S]{0,250}GitHub/.test(body), 'Missing ChatGPT GitHub work owner');
  check(/Agy[\s\S]{0,250}(Fedora|local)/i.test(body), 'Missing Agy machine-only scope');
  check(/not (?:assign|delegate)|must not delegate|Do \*\*not\*\* assign/i.test(body),
    'Missing protection against delegating GitHub-only tasks to Agy');
  check(/(?:#25|25[^\d])[\s\S]{0,250}(?:PARTIALLY COMPLETE|Incomplete|unverified)/i.test(body),
    'No task-25 unresolved state');

  const action = body.split('## Next local action')[1]?.split('\n## ')[0] || '';
  check(/\`\`\`(?:bash|sh|powershell)[\s\S]+?\`\`\`/.test(action),
    'Next local action lacks an executable shell command');
  check(/read-only|disposable|no game restart/i.test(action), 'Next local action missing safety boundary');

  // Refuse false terminal-game success in a static GitHub source-only checkpoint.
  const verdict = body.split('**Separate five-state acceptance verdicts:**')[1]?.split('\n')[0] || '';
  check(verdict.length > 0, 'Missing five-way acceptance verdict');
  if (verdict) {
    for (const stage of ['GitHub source', 'Fedora preflight', 'disposable', 'same-world', 'autonomous']) {
      check(verdict.toLowerCase().includes(stage.toLowerCase()), 'Missing verdict: ' + stage);
    }
    check(!/same-world[^;\n]*VERIFIED COMPLETE|autonomous[^;\n]*VERIFIED COMPLETE/i.test(verdict),
      'Live success incorrectly claimed without independently supplied host evidence');
  }
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = process.argv[2] || defaultFile;
  try {
    const errors = validateHandoff(readFileSync(path, 'utf8'));
    if (errors.length) {
      for (const error of errors) console.error('HANDOFF FAIL: ' + error);
      process.exitCode = 1;
    } else {
      console.log('HANDOFF PASS: structure, source evidence, owner split and conservative status; no live server checked');
    }
  } catch (error) {
    console.error('HANDOFF FAIL: ' + error.message);
    process.exitCode = 1;
  }
}
