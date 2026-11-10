#!/usr/bin/env node
// Installs the JoshRS original quest "The Peace Shirt" into a revision-377 Content checkout.
//
// It (1) makes the spare, unused cache varp `varp_724` saved with the character (scope=perm;
// a server-only property, so the client cache and the .varp build checksum are unchanged),
// (2) adds the quest's 1 quest point to [proc,count_questpoints], and (3) copies the quest
// script plus the Burgh de Rott NPC dialogue it hooks into.
//
//   node install.mjs --content <content dir>            dry run (prints what would change)
//   node install.mjs --content <content dir> --apply    apply (backs up every changed file)
//
// Refuses the active runtime unless --allow-active is given by the person doing an approved,
// offline, backed-up deployment.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const QP_MARK = '// JoshRS original quest: The Peace Shirt';
const QP_BLOCK = `${QP_MARK} (progress in varp_724, 6 = complete), 1 quest point.\nif (%varp_724 >= 6) {\n    $questpoints = add($questpoints, 1);\n}\n`;

export function patchVarp(text) {
    const nl = text.includes('\r\n') ? '\r\n' : '\n';
    const m = text.match(/^\[varp_724\]\r?\n((?:[^\[\r\n].*\r?\n)*)/m);
    if (!m) throw new Error('[varp_724] not found in all.varp; unexpected content. Refusing.');
    const body = m[1];
    if (/^scope=perm\s*$/m.test(body)) return { text, changed: false };
    if (/^\w+=/m.test(body)) throw new Error('[varp_724] already has properties; it may be in use. Refusing.');
    return { text: text.replace(/^\[varp_724\]\r?\n/m, `[varp_724]${nl}scope=perm${nl}`), changed: true };
}

export function patchQuestPoints(text) {
    if (text.includes(QP_MARK)) return { text, changed: false };
    const start = text.indexOf('[proc,count_questpoints]');
    if (start < 0) throw new Error('[proc,count_questpoints] not found. Refusing.');
    const ret = text.indexOf('return ($questpoints);', start);
    if (ret < 0) throw new Error('count_questpoints has no return; unexpected content. Refusing.');
    const nl = text.includes('\r\n') ? '\r\n' : '\n';
    return { text: text.slice(0, ret) + QP_BLOCK.replaceAll('\n', nl) + text.slice(ret), changed: true };
}

export function checkVarpUnused(scriptsDir) {
    // varp_724 must not be used by anything except this quest.
    const hits = [];
    const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.rs2') && fs.readFileSync(p, 'utf8').includes('%varp_724')) hits.push(p); } };
    walk(scriptsDir);
    const ours = new Set(['quest_peace_shirt.rs2', 'burgh_vilager_3.rs2', 'burgh_vilager_5.rs2', 'burgh_vilager_8.rs2', 'quests.rs2']);
    const foreign = hits.filter(h => !ours.has(path.basename(h)));
    if (foreign.length) throw new Error('varp_724 is already used by: ' + foreign.join(', '));
}

export function install(content, { apply = false, allowActive = false, launcherRoot = 'C:\\JoshRS-Launcher\\JoshRS-main' } = {}) {
    const abs = path.resolve(content);
    const activeFile = path.join(launcherRoot, 'runtime', 'jparris-377', 'active.json');
    if (!allowActive && fs.existsSync(activeFile)) {
        const active = JSON.parse(fs.readFileSync(activeFile, 'utf8').trimStart());
        if (typeof active.content === 'string' && path.resolve(active.content).toLowerCase() === abs.toLowerCase()) {
            throw new Error('REFUSED: this is the active family world. Use --allow-active only for an approved offline deployment after a verified backup.');
        }
    }
    const scripts = path.join(abs, 'scripts');
    const varpFile = path.join(scripts, '_unpack', '377', 'all.varp');
    const qpFile = path.join(scripts, 'general', 'scripts', 'quests.rs2');
    const dest = path.join(scripts, 'joshrs_original', 'scripts');
    checkVarpUnused(scripts);
    const varp = patchVarp(fs.readFileSync(varpFile, 'utf8'));
    const qp = patchQuestPoints(fs.readFileSync(qpFile, 'utf8'));
    const copies = [
        [path.join(here, 'scripts', 'quest_peace_shirt.rs2'), path.join(dest, 'quest_peace_shirt.rs2')],
        ...['burgh_vilager_3', 'burgh_vilager_5', 'burgh_vilager_8'].map(n => [path.join(here, '..', '..', 'npc-voices', 'scripts', `${n}.rs2`), path.join(dest, `${n}.rs2`)])
    ];
    const plan = { content: abs, varpScopePerm: varp.changed, questPoint: qp.changed, copies: copies.map(c => path.relative(abs, c[1])), dryRun: !apply };
    if (!apply) return plan;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = f => { if (fs.existsSync(f)) fs.copyFileSync(f, `${f}.peace-shirt-${stamp}.bak`); };
    if (varp.changed) { backup(varpFile); fs.writeFileSync(varpFile, varp.text); }
    if (qp.changed) { backup(qpFile); fs.writeFileSync(qpFile, qp.text); }
    fs.mkdirSync(dest, { recursive: true });
    for (const [from, to] of copies) { backup(to); fs.copyFileSync(from, to); }
    return plan;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const val = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
    try {
        if (!val('--content')) throw new Error('Provide --content <revision-377 Content directory>');
        const plan = install(val('--content'), { apply: args.includes('--apply'), allowActive: args.includes('--allow-active') });
        console.log(JSON.stringify(plan, null, 2));
        console.log(plan.dryRun ? 'DRY RUN: nothing changed.' : 'Installed. Rebuild packs (npm run build) and playtest before playing.');
    } catch (e) { console.error('BLOCKED: ' + e.message); process.exitCode = 1; }
}
