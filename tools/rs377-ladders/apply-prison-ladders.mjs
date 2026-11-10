#!/usr/bin/env node
// Patch a disposable rev377 Content clone only. NEVER edit the active family game.
//
// Pinned 377 has loc 9558 (prison_ladder_up) and 9559 (prison_laddertop) placed
// as three complete same-tile ladder pairs, but ladders.rs2 has no oploc handler
// for either type. Clicking them returns "Nothing interesting happens.".
// This adds the three verified pairs and leaves the fourth, incomplete placement
// at 1_47_49_45_43 unhandled on purpose.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const liveRoot = path.join('runtime', 'jparris-377');

const block = [
    '',
    '// JoshRS: prison/jail ladders (loc 9558/9559) had no handlers in pinned 377.',
    '// Same-tile up/down for the three complete pairs. The fourth placement at',
    '// 1_47_49_45_43 has no matching top and is deliberately left unhandled.',
    '[oploc1,prison_ladder_up]',
    'p_arrivedelay;',
    'switch_coord (loc_coord) {',
    '    case 0_45_51_35_59 : ~climb_ladder(movecoord(loc_coord, 0, 1, 0), true);',
    '    case 0_46_50_4_13 : ~climb_ladder(movecoord(loc_coord, 0, 1, 0), true);',
    '    case 0_47_49_2_48 : ~climb_ladder(movecoord(loc_coord, 0, 1, 0), true);',
    '    case default : mes("unhandled ladder <~coord_tostring(loc_coord)>");',
    '}',
    '',
    '[oploc1,prison_laddertop]',
    'p_arrivedelay;',
    'switch_coord (loc_coord) {',
    '    case 1_45_51_35_59 : ~climb_ladder(movecoord(loc_coord, 0, -1, 0), false);',
    '    case 1_46_50_4_13 : ~climb_ladder(movecoord(loc_coord, 0, -1, 0), false);',
    '    case 1_47_49_2_48 : ~climb_ladder(movecoord(loc_coord, 0, -1, 0), false);',
    '    case default : mes("unhandled ladder <~coord_tostring(loc_coord)>");',
    '}',
    ''
].join('\n');

export function patchText(script, pack) {
    for (const [id, name] of [[9558, 'prison_ladder_up'], [9559, 'prison_laddertop']]) {
        if (!new RegExp(`^${id}=${name}\\s*$`, 'm').test(pack)) {
            throw new Error(`Unexpected loc mapping for ${id}; 377 content mismatch. Refusing to patch.`);
        }
    }
    for (const tag of ['[label,ladder_options]', '[proc,climb_ladder]']) {
        if (!script.includes(tag)) throw new Error('Missing upstream ladder helper: ' + tag);
    }
    if (/\[oploc1,prison_ladder_(up|top)\]/.test(script)) throw new Error('Prison ladder handlers already present.');
    return script.replace(/\s*$/, '\n') + block;
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
        const backup = file + '.joshrs-prison-ladder.original';
        fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
        const temp = file + '.joshrs-prison-ladder.tmp';
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
        console.log('Targets: prison ladder pairs 2915,3323 / 2948,3213 / 3010,3184, both directions.');
    } catch (err) {
        console.error('BLOCKED: ' + err.message);
        process.exitCode = 1;
    }
}
