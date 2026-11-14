import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectTarget } from './install.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const overlay = fs.readFileSync(path.join(repo, 'content-patches/rs377/scripts/skill_woodcutting/scripts/joshrs_canoes_377.rs2'), 'utf8');
const stations = ['lumbridge', 'championsguild', 'barbarianvillage', 'edgeville'];
const stationIds = [12163, 12164, 12165, 12166];

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'joshrs-canoe-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const content = path.join(dir, 'disposable-content');
  const scriptDir = path.join(content, 'scripts');
  fs.mkdirSync(path.join(content, 'pack'), { recursive: true });
  fs.mkdirSync(path.join(scriptDir, '_unpack', '377'), { recursive: true });
  fs.mkdirSync(path.join(scriptDir, 'interfaces'), { recursive: true });
  fs.mkdirSync(path.join(scriptDir, 'skill_woodcutting', 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(content, 'pack', 'loc.pack'), stationIds.map((id, i) => id + '=canoeing_canoestation_' + stations[i]).join('\n'));
  fs.writeFileSync(path.join(scriptDir, '_unpack', '377', 'all.loc'), stations.map(s => '[canoeing_canoestation_' + s + ']\n').join(''));
  for (const name of ['canoeing.if', 'canoe_map.if']) fs.writeFileSync(path.join(scriptDir, 'interfaces', name), '[title]\n');
  fs.writeFileSync(path.join(scriptDir, 'skill_woodcutting', 'scripts', 'woodcut.rs2'), '[proc,woodcutting_axe_checker]\n');
  return { dir, content, target: path.join(scriptDir, 'skill_woodcutting', 'scripts', 'joshrs_canoes_377.rs2') };
}

test('real revision-377 parent loc triggers and complete canoe stages', () => {
  for (const station of stations) {
    assert.equal(overlay.split('[oploc1,canoeing_canoestation_' + station + ']').length - 1, 1);
    assert.match(overlay, new RegExp('canoestation_state_' + station));
  }
  for (const action of ['joshrs_canoe_station', 'joshrs_canoe_shape', 'joshrs_canoe_map',
    'joshrs_canoe_travel', 'joshrs_canoe_wilderness', 'joshrs_canoe_near']) {
    assert.match(overlay, new RegExp('\\[label,' + action + '|\\[proc,' + action));
  }
  assert.match(overlay, /~woodcutting_axe_checker\(true\)/);
  assert.match(overlay, /stat_advance\(woodcutting, \$xp\)/);
  assert.match(overlay, /~joshrs_canoe_setstage\(\$from, 0\)/);
  assert.match(overlay, /case 4 : p_telejump\(0_48_54_60_54\)/);
  assert.doesNotMatch(overlay, /\[oploc1,canoestation_tree\]/); // actual dispatch is parent loc
});

test('dry-run is read-only; apply only creates a new overlay once', t => {
  const { content, target } = fixture(t);
  const dry = inspectTarget(repo, content);
  assert.equal(dry.status, 'READ_ONLY_DRY_RUN');
  assert.equal(dry.newStationHandlers, 4);
  assert.equal(fs.existsSync(target), false);
  const applied = inspectTarget(repo, content, true);
  assert.equal(applied.status, 'DISPOSABLE_SOURCE_OVERLAY_INSTALLED');
  assert.equal(applied.compiled, false);
  assert.equal(fs.readFileSync(target, 'utf8'), overlay);
  assert.throws(() => inspectTarget(repo, content, true), /overlay exists/);
});

test('refuses native 377 ID drift and concurrent handlers', t => {
  const { content } = fixture(t);
  const pack = path.join(content, 'pack', 'loc.pack');
  fs.writeFileSync(pack, fs.readFileSync(pack, 'utf8').replace('12165=canoeing_canoestation_barbarianvillage', '12165=other'));
  assert.throws(() => inspectTarget(repo, content, true), /missing native 377 station mapping/);
  fs.writeFileSync(pack, stationIds.map((id, i) => id + '=canoeing_canoestation_' + stations[i]).join('\n'));
  fs.writeFileSync(path.join(content, 'scripts', 'another.rs2'), '[oploc1,canoeing_canoestation_lumbridge]\n');
  assert.throws(() => inspectTarget(repo, content, true), /canoe triggers already exist/);
});

test('refuses actual repo and active family-world path', t => {
  const { content } = fixture(t);
  assert.throws(() => inspectTarget(repo, repo, true), /REFUSED/);
  const active = path.join(repo, 'runtime', 'jparris-377');
  // The guard runs before checking directory structure, so an existing live
  // runtime can never be used as a target. Do not create or edit live folders.
  if (fs.existsSync(active)) assert.throws(() => inspectTarget(repo, active, true), /REFUSED/);
  assert.equal(fs.existsSync(path.join(content, 'pack', 'loc.pack')), true);
});
