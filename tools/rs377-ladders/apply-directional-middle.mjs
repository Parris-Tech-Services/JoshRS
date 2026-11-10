#!/usr/bin/env node
// Patch a disposable rev377 Content clone only. NEVER edit the active family game.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const additions = [
  '',
  '// JoshRS: loc ID 1751 (directional middle ladder), missing in pinned 377.',
  '// Reuse the existing ID 1748 ladder movement, dialogue and animation helpers.',
  '[oploc1,loc_1751]',
  'p_arrivedelay;',
  '@ladder_options(movecoord(coord(), 0, 1, 0), movecoord(coord(), 0, -1, 0));',
  '',
  '[oploc2,loc_1751]',
  'p_arrivedelay;',
  '~climb_ladder(movecoord(coord(), 0, 1, 0), true);',
  '',
  '[oploc3,loc_1751]',
  'p_arrivedelay;',
  '~climb_ladder(movecoord(coord(), 0, -1, 0), false);',
  ''
].join('\n');
const anchor = '\n[oploc1,loc_1749]';
const liveRoot = path.join('runtime', 'jparris-377');

export function patchText(script, pack) {
  if (!/^1748=laddermiddle\s*$/m.test(pack) || !/^1751=loc_1751\s*$/m.test(pack)) {
    throw new Error('Unexpected loc IDs; 377 content mismatch. Refusing to patch.');
  }
  for (const tag of ['[oploc1,laddermiddle]', '[oploc2,laddermiddle]',
    '[oploc3,laddermiddle]', '[label,ladder_options]', '[proc,climb_ladder]']) {
    if (!script.includes(tag)) throw new Error('Missing upstream handler: ' + tag);
  }
  if (/\[oploc[123],loc_1751\]/.test(script)) {
    throw new Error('Ladder ID 1751 already has a handler; do not add a duplicate.');
  }
  if (script.split(anchor).length !== 2) throw new Error('Source drift: missing/duplicate 1749 anchor.');
  return script.replace(anchor, additions + anchor);
}
export function inspectTarget(repoRoot, contentRoot, apply = false) {
  const repo = fs.realpathSync(repoRoot);
  const content = fs.realpathSync(contentRoot);
  const normal = s => path.resolve(s).replaceAll('/', '\\').toLowerCase();
  const live = normal(path.join(repo, liveRoot));
  if (normal(content) === live || normal(content).startsWith(live + '\\')) {
    throw new Error('REFUSED: content under active runtime/jparris-377.');
  }
  const stateFile = path.join(repo, liveRoot, 'active.json');
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8').trimStart());
    if (typeof state.content === 'string' && normal(content) === normal(state.content)) {
      throw new Error('REFUSED: active.json points to this content.');
    }
  }
  const file = path.join(content, 'scripts', 'ladders+stairs', 'scripts', 'ladders.rs2');
  const packFile = path.join(content, 'pack', 'loc.pack');
  const oldText = fs.readFileSync(file, 'utf8');
  const next = patchText(oldText, fs.readFileSync(packFile, 'utf8'));
  if (apply) {
    const backup = file + '.joshrs1751.original';
    fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
    const temp = file + '.joshrs1751.tmp';
    try {
      fs.writeFileSync(temp, next, { flag: 'wx' });
      fs.renameSync(temp, file);
    } catch (err) {
      if (fs.existsSync(temp)) fs.rmSync(temp);
      throw err;
    }
  }
  return { dryRun: !apply, target: file, addedBytes: Buffer.byteLength(next)-Buffer.byteLength(oldText) };
}
const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  try {
    const args = process.argv.slice(2);
    const val = key => { const i = args.indexOf(key); return i >= 0 ? args[i+1] : null; };
    if (!val('--content')) throw new Error('Provide --content PATH of a disposable 377 Content clone');
    const root = val('--repo') ?? path.resolve(path.dirname(thisFile), '../..');
    const result = inspectTarget(root, val('--content'), args.includes('--apply'));
    console.log(JSON.stringify(result, null, 2));
    console.log(result.dryRun ? 'DRY RUN: no files changed.' : 'Isolated clone patched. Build and playtest before deploying.');
    console.log('Object ID 1751 is a real missing handler; not yet proven to be the clicked Falador ladder.');
  } catch (err) {
    console.error('BLOCKED: ' + err.message);
    process.exitCode = 1;
  }
}
