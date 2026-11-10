#!/usr/bin/env node
// Patch a disposable rev377 Content clone only. NEVER edit the active family game.
//
// Real object IDs identified from the pinned 377 map data and loc definitions:
//   11739/11740  Ladder, Climb-up,   forceapproach north (same tile, plane + 1)
//   11741/11742  Ladder, Climb-down, forceapproach south (same tile, plane - 1)
// The pinned 377 ladders.rs2 had no oploc handler for any of them, so the
// engine fell through to "Nothing interesting happens.".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const additions = [
    '',
    '// JoshRS: Falador-style vertical ladder pairs. The pinned 377 source has',
    '// loc_11739..loc_11742 defined and placed, but no oploc handlers.',
    '[oploc1,loc_11739]',
    'p_arrivedelay;',
    '~climb_ladder(movecoord(coord(), 0, 1, 0), true);',
    '',
    '[oploc1,loc_11740]',
    'p_arrivedelay;',
    '~climb_ladder(movecoord(coord(), 0, 1, 0), true);',
    '',
    '[oploc1,loc_11741]',
    'p_arrivedelay;',
    '~climb_ladder(movecoord(coord(), 0, -1, 0), false);',
    '',
    '[oploc1,loc_11742]',
    'p_arrivedelay;',
    '~climb_ladder(movecoord(coord(), 0, -1, 0), false);',
    ''
].join('\n');
const anchor = '\n[oploc1,loc_11727]';
const liveRoot = path.join('runtime', 'jparris-377');

export function patchText(script, pack) {
    for (const id of [11739, 11740, 11741, 11742]) {
        if (!new RegExp(`^${id}=loc_${id}\\s*$`, 'm').test(pack)) {
            throw new Error(`Unexpected loc mapping for ${id}; 377 content mismatch. Refusing to patch.`);
        }
    }
    for (const tag of ['[oploc1,loc_11728]', '[label,ladder_options]', '[proc,climb_ladder]']) {
        if (!script.includes(tag)) throw new Error('Missing upstream ladder helper/anchor: ' + tag);
    }
    if (/\[oploc1,loc_11739\]/.test(script)) {
        throw new Error('Ladder IDs already have handlers; do not add duplicates.');
    }
    if (script.split(anchor).length !== 2) throw new Error('Source drift: missing/duplicate loc_11727 anchor.');
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
        const backup = file + '.joshrs-falador-ladder.original';
        fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
        const temp = file + '.joshrs-falador-ladder.tmp';
        try {
            fs.writeFileSync(temp, next, { flag: 'wx' });
            fs.renameSync(temp, file);
        } catch (err) {
            if (fs.existsSync(temp)) fs.rmSync(temp);
            throw err;
        }
    }
    return { dryRun: !apply, target: file, addedBytes: Buffer.byteLength(next) - Buffer.byteLength(oldText) };
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
    try {
        const args = process.argv.slice(2);
        const val = key => {
            const i = args.indexOf(key);
            return i >= 0 ? args[i + 1] : null;
        };
        if (!val('--content')) throw new Error('Provide --content PATH of a disposable 377 Content clone');
        const root = val('--repo') ?? path.resolve(path.dirname(thisFile), '../..');
        const result = inspectTarget(root, val('--content'), args.includes('--apply'));
        console.log(JSON.stringify(result, null, 2));
        console.log(result.dryRun ? 'DRY RUN: no files changed.' : 'Isolated clone patched. Build and playtest before deploying.');
        console.log('Targets: Falador loc 11739/11740 (up) and 11741/11742 (down), same tile plane transitions.');
    } catch (err) {
        console.error('BLOCKED: ' + err.message);
        process.exitCode = 1;
    }
}
