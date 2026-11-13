#!/usr/bin/env node
// Patch a disposable rev377 Content clone only. NEVER edit the active family game.
//
// Issue #297: native locs 9322/9323/9324 ("Log balance", Walk-across) and their
// six-tile bridge deck are on plane 1, but the player banks and the clickable
// surface are plane 0. A script-only handler cannot be reached because
// OpLocHandler resolves locs at player.level.
//
// This patch adds two plane-0 log-end interaction locs on the safe bank tiles
// (2722,3591) and (2722,3598), then adds a 48-Agility two-way crossing that uses
// the existing plane-1 bridge deck. It does not move terrain, add water walking,
// or touch any player data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const liveRoot = path.join('runtime', 'jparris-377');
const MAP_ANCHOR = '==== LOC ====';
const MAP_ADDITIONS = ['0 34 7: 9324 22', '0 34 14: 9322 22'].join('\n');

const SCRIPT_BLOCK = [
    '',
    '// JoshRS: Sinclair Mansion / Fremennik river log balance (#297).',
    '// Native 9322/9323/9324 and the bridge deck are plane 1; the banks are',
    '// plane 0. Plane-0 log-end locs make the interaction reachable, then this',
    '// script uses the existing plane-1 deck and returns the player to the',
    '// opposite bank. Requires 48 Agility, both directions.',
    '[oploc1,loc_9322] @sinclair_log_balance;',
    '[oploc1,loc_9323] @sinclair_log_balance;',
    '[oploc1,loc_9324] @sinclair_log_balance;',
    '',
    '[label,sinclair_log_balance]',
    'if (stat(agility) < 48) {',
    '    ~mesbox("You need an Agility level of 48 to cross this log.");',
    '    return;',
    '}',
    'if (coordy(coord) ! 0) {',
    '    mes("You can\'t reach the log from there.");',
    '    return;',
    '}',
    'def_int $dir = 1;',
    'if (coordz(coord) > 3594) {',
    '    $dir = -1;',
    '}',
    'p_arrivedelay;',
    'mes("You walk carefully across the slippery log...");',
    'if ($dir = 1) {',
    '    p_teleport(1_42_56_34_9);',
    '} else {',
    '    p_teleport(1_42_56_34_11);',
    '}',
    'p_delay(0);',
    '~set_readywalk_bas(human_walk_logbalance_ready, human_walk_logbalance);',
    '~forcemove(movecoord(coord, 0, 0, multiply($dir, 3)));',
    'sound_synth(log_balance, 2, 0);',
    '~update_bas;',
    'p_delay(0);',
    'if ($dir = 1) {',
    '    p_teleport(0_42_56_34_14);',
    '} else {',
    '    p_teleport(0_42_56_34_6);',
    '}',
    'mes("...You make it safely to the other side.");',
    ''
].join('\n');

export function patchMap(text) {
    if (text.includes(MAP_ADDITIONS.split('\n')[0])) throw new Error('Plane-0 Sinclair log-end loc already present.');
    if (text.split(MAP_ANCHOR).length !== 2) throw new Error('Map source drift: expected exactly one LOC section.');
    return text.replace(MAP_ANCHOR, MAP_ANCHOR + '\n' + MAP_ADDITIONS);
}

export function patchScript(text) {
    if (text.includes('sinclair_log_balance')) throw new Error('Sinclair crossing script already present.');
    if (!text.includes('[oploc1,loc_2296]')) throw new Error('Script source drift: Coal Trucks anchor missing.');
    return text.replace(/\s*$/, '\n') + SCRIPT_BLOCK;
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
    const mapFile = path.join(content, 'maps', 'm42_56.jm2');
    const scriptFile = path.join(content, 'scripts', 'skill_agility', 'scripts', 'shortcuts.rs2');
    const mapText = fs.readFileSync(mapFile, 'utf8');
    const scriptText = fs.readFileSync(scriptFile, 'utf8');
    const nextMap = patchMap(mapText);
    const nextScript = patchScript(scriptText);
    if (apply) {
        for (const [file, next] of [[mapFile, nextMap], [scriptFile, nextScript]]) {
            const backup = file + '.joshrs-sinclair.original';
            fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
            const temp = file + '.joshrs-sinclair.tmp';
            try {
                fs.writeFileSync(temp, next, { flag: 'wx' });
                fs.renameSync(temp, file);
            } catch (err) {
                if (fs.existsSync(temp)) fs.rmSync(temp);
                throw err;
            }
        }
    }
    return {
        dryRun: !apply,
        mapFile,
        scriptFile,
        mapAddedBytes: Buffer.byteLength(nextMap) - Buffer.byteLength(mapText),
        scriptAddedBytes: Buffer.byteLength(nextScript) - Buffer.byteLength(scriptText)
    };
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
        console.log('Targets: plane-0 log ends at 2722,3591 and 2722,3598; 48-Agility two-way crossing over the existing plane-1 deck.');
    } catch (err) {
        console.error('BLOCKED: ' + err.message);
        process.exitCode = 1;
    }
}
