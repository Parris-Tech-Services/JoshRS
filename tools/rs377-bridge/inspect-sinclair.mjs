#!/usr/bin/env node
// Read-only map and script inspection for the Sinclair Mansion river shortcut.
// Does not edit maps, saves, packs, client caches, world state or databases.
// NOTE: modern OSRS object IDs are evidence, not assumed valid 377 IDs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REGION_NAMES = ['m42_55.jm2', 'm42_56.jm2', 'm43_55.jm2', 'm43_56.jm2'];
const MODERN_REFERENCE_IDS = [16540, 16541, 16542];
const SEARCH_BOUNDS = { minX: 2695, maxX: 2800, minZ: 3560, maxZ: 3625 };

export function parseLocPack(pack) {
  const ids = new Map();
  for (const rawLine of pack.split(/\r?\n/)) {
    const match = rawLine.trim().match(/^(\d+)=(.+)$/);
    if (match) ids.set(Number(match[1]), match[2]);
  }
  return ids;
}

export function parseJm2Locs(fileName, text) {
  const region = fileName.match(/^m(\d+)_(\d+)\.jm2$/);
  if (!region) throw new Error('Invalid JM2 region filename');
  const rx = Number(region[1]);
  const rz = Number(region[2]);
  const section = text.split('==== LOC ====')[1];
  if (!section) throw new Error('Missing LOC section in ' + fileName);
  const rows = [];
  for (const line of section.split('====')[0].split(/\r?\n/)) {
    const match = line.match(/^(\d+)\s+(\d+)\s+(\d+):\s+(\d+)\s+(\d+)(?:\s+(\d+))?/);
    if (!match) continue;
    rows.push({
      level: Number(match[1]),
      x: rx * 64 + Number(match[2]),
      z: rz * 64 + Number(match[3]),
      id: Number(match[4]),
      shape: Number(match[5]),
      angle: Number(match[6] || 0),
    });
  }
  return rows;
}

export function inspect(contentDir) {
  const locPackFile = path.join(contentDir, 'pack', 'loc.pack');
  const locNames = parseLocPack(fs.readFileSync(locPackFile, 'utf8'));
  const entries = REGION_NAMES.flatMap(file => parseJm2Locs(file, fs.readFileSync(path.join(contentDir, 'maps', file), 'utf8')));
  const nearby = entries.filter(l => l.level === 0 && l.x >= SEARCH_BOUNDS.minX && l.x <= SEARCH_BOUNDS.maxX && l.z >= SEARCH_BOUNDS.minZ && l.z <= SEARCH_BOUNDS.maxZ);
  const namedShortcuts = nearby.map(l => ({...l, name: locNames.get(l.id) || 'UNREGISTERED'}))
    .filter(l => /bridge|balance|log|shortcut|cross|walkway|rope|plank|step/i.test(l.name));
  const modernIdsOnMap = nearby.filter(l => MODERN_REFERENCE_IDS.includes(l.id));
  const modernIdsInPack = MODERN_REFERENCE_IDS.filter(id => locNames.has(id));
  const historicalOtherLocations = [...new Set(entries.map(l => l.id))].filter(id => /log.balance|bridge|shortcut/i.test(locNames.get(id) || ''));
  const file = path.join(contentDir, 'scripts', 'skill_agility', 'scripts', 'shortcuts.rs2');
  const script = fs.readFileSync(file, 'utf8');
  return {
    inspectedAtUtc: new Date().toISOString(),
    contentDir,
    regionFiles: REGION_NAMES,
    bounds: SEARCH_BOUNDS,
    locsInBounds: nearby.length,
    candidateNamedShortcuts: namedShortcuts,
    historicalShortcutLocationIdsInRegions: historicalOtherLocations,
    modernReferenceIdsInPack: modernIdsInPack,
    modernReferenceObjectsOnMap: modernIdsOnMap,
    scriptMentionsSinclairOrFremennik: /sinclair|fremennik/i.test(script),
    note: 'Do not assign modern OSRS IDs or create teleports without checking the actual 377 cache object, exact tile, bank access, agility level, animation, and reciprocal traversal.',
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--content');
  const root = index < 0 ? null : process.argv[index + 1];
  if (!root || !path.isAbsolute(root)) {
    console.error('Usage: node tools/rs377-bridge/inspect-sinclair.mjs --content <absolute path to 377 content>');
    process.exitCode = 2;
  } else {
    try {
      console.log(JSON.stringify(inspect(root), null, 2));
      console.error('READ ONLY: no changes to maps, server, players or files.');
    } catch (err) {
      console.error('Inspection failed: ' + err.message);
      process.exitCode = 1;
    }
  }
}
