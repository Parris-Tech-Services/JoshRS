#!/usr/bin/env node
// Install ONLY into a disposable rev377 Content clone, never a running family
// world. This is a source overlay: it does not rebuild/restart or touch saves.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultRepo = path.resolve(here, '../..');
const relative = 'scripts/skill_woodcutting/scripts/joshrs_canoes_377.rs2';
const stationNames = [
  'canoeing_canoestation_lumbridge',
  'canoeing_canoestation_championsguild',
  'canoeing_canoestation_barbarianvillage',
  'canoeing_canoestation_edgeville'
];
const stationIds = [12163, 12164, 12165, 12166];
const normal = value => path.resolve(value).replaceAll('\\', '/').toLowerCase();

function scanForTriggers(start) {
  const collisions = [];
  const wanted = stationNames.map(name => '[oploc1,' + name + ']');
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      if (!entry.isFile() || !entry.name.endsWith('.rs2')) continue;
      const source = fs.readFileSync(full, 'utf8');
      for (const trigger of wanted) {
        if (source.includes(trigger)) collisions.push({ file: full, trigger });
      }
    }
  };
  walk(start);
  return collisions;
}

export function inspectTarget(repoRoot, contentRoot, apply = false) {
  const repo = fs.realpathSync(repoRoot);
  const content = fs.realpathSync(contentRoot);
  const target = path.join(content, relative);
  const source = path.join(repo, 'content-patches', 'rs377', relative);
  const current = normal(content);
  const activeDefault = normal(path.join(repo, 'runtime', 'jparris-377'));
  if (current === activeDefault || current.startsWith(activeDefault + '/') ||
      current.includes('/joshrs-launcher/') || current.endsWith('/joshrs-launcher') ||
      current === normal(repo) || current.startsWith(normal(repo) + '/runtime/')) {
    throw new Error('REFUSED: active or ambiguous family-world source path');
  }
  const activeFile = path.join(repo, 'runtime', 'jparris-377', 'active.json');
  if (fs.existsSync(activeFile)) {
    const active = JSON.parse(fs.readFileSync(activeFile, 'utf8').trimStart());
    for (const candidate of [active.content, active.contentDir, active.contentRoot]) {
      if (typeof candidate === 'string' && candidate.length > 0 && current === normal(candidate)) {
        throw new Error('REFUSED: active.json identifies the live Content directory');
      }
    }
  }
  if (fs.existsSync(target)) {
    throw new Error('REFUSED: canoe overlay exists; preserve local modifications');
  }
  const pack = fs.readFileSync(path.join(content, 'pack', 'loc.pack'), 'utf8');
  const all = fs.readFileSync(path.join(content, 'scripts', '_unpack', '377', 'all.loc'), 'utf8');
  for (let i = 0; i < stationNames.length; i++) {
    if (!new RegExp('^' + stationIds[i] + '=' + stationNames[i] + '$', 'm').test(pack) ||
        !all.includes('[' + stationNames[i] + ']')) {
      throw new Error('REFUSED: missing native 377 station mapping for ' + stationNames[i]);
    }
  }
  for (const rel of ['scripts/interfaces/canoeing.if', 'scripts/interfaces/canoe_map.if',
    'scripts/skill_woodcutting/scripts/woodcut.rs2']) {
    if (!fs.existsSync(path.join(content, rel))) {
      throw new Error('REFUSED: missing pinned native 377 dependency: ' + rel);
    }
  }
  const conflicts = scanForTriggers(path.join(content, 'scripts'));
  if (conflicts.length > 0) {
    throw new Error('REFUSED: canoe triggers already exist in ' + conflicts.map(c => c.file).join(', '));
  }
  const sourceText = fs.readFileSync(source, 'utf8');
  for (const name of stationNames) {
    if (!sourceText.includes('[oploc1,' + name + ']')) {
      throw new Error('Incomplete canoe overlay: ' + name);
    }
  }
  if (apply) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, sourceText, { flag: 'wx' });
  }
  return { status: apply ? 'DISPOSABLE_SOURCE_OVERLAY_INSTALLED' : 'READ_ONLY_DRY_RUN',
    target, bytes: Buffer.byteLength(sourceText), newStationHandlers: stationNames.length,
    liveGameTouched: false, compiled: false, playtested: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const index = args.indexOf('--content');
    if (index < 0 || !args[index + 1]) {
      throw new Error('Usage: node tools/rs377-canoes/install.mjs --content PATH [--apply] [--repo PATH]; only a DISPOSABLE clone');
    }
    const ri = args.indexOf('--repo');
    const repo = ri >= 0 ? args[ri + 1] : defaultRepo;
    console.log(JSON.stringify(inspectTarget(repo, args[index + 1], args.includes('--apply')), null, 2));
  } catch (error) {
    console.error('BLOCKED: ' + error.message);
    process.exitCode = 1;
  }
}
