import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const load = async file => readFile(new URL(file, root), 'utf8');
const reference = JSON.parse(await load('docs/REFERENCE_VERSION_LOCK.json'));

test('BASE-02 is locked to exactly one November 2004 rev-274 reference', () => {
  assert.equal(reference.schemaVersion, 1);
  assert.equal(reference.decision, 'BASE-02');
  assert.equal(reference.status, 'adopted');
  assert.equal(reference.selectedOption, 'A');
  assert.equal(reference.referenceDate, '2004-11-23');
  assert.equal(reference.referenceRevision, 274);
  assert.equal(reference.referenceGame, 'RuneScape 2 (historical gameplay/visual reference only)');
  assert.equal(reference.referenceProject, 'Lost City / 2004Scape');
  assert.equal(reference.releaseMode, 'original-licensed-assets-only');
  assert.equal(reference.assetRights, 'No Jagex proprietary assets approved for public redistribution');
  assert.deepEqual(
    [reference.engine.branch, reference.content.branch],
    ['274','274'],
    'engine and content must stay on the same revision'
  );
  assert.ok(reference.excludedAsBaseline.includes('2007-based OSRS snapshot'));
  assert.ok(reference.excludedAsBaseline.includes('current Old School RuneScape'));
});

test('technical reference pins match the actual research Docker build', async () => {
  const docker = await load('deploy/server/Dockerfile');
  for(const component of ['engine', 'content']) {
    const {repo, pinnedCommit} = reference[component];
    assert.match(pinnedCommit, /^[0-9a-f]{40}$/);
    assert.ok(docker.includes('https://github.com/'+repo+'.git'),
      component+' research repository differs from the decision');
    assert.ok(docker.includes('git fetch --depth 1 origin '+pinnedCommit),
      component+' commit differs from the pinned research build');
  }
});

test('brief, README and master roadmap all declare the same frozen era', async () => {
  const [brief, readme, checklist] = await Promise.all([
    load(reference.brief),
    load('README.md'),
    load('docs/FULL_CLASSIC_MMO_CHECKLIST.md')
  ]);
  for(const phrase of ['23 November 2004','revision 274','Option A']) {
    assert.ok(brief.includes(phrase), 'brief missing '+phrase);
  }
  assert.ok(brief.includes('RIGHT') || brief.includes('Jagex'), 'brief must state the rights boundary');
  assert.ok(brief.includes('BASE-03') && brief.includes('BASE-04'), 'remaining verification must be tracked');
  assert.ok(readme.includes('docs/REFERENCE_VERSION_274.md'), 'README must link the frozen design brief');
  assert.match(checklist, /^- \[x\] \*\*BASE-02\*\* /m, 'BASE-02 must be checked only once version is documented');
  assert.match(checklist, /BASE-02[^\n]*Option A[^\n]*revision 274/m);
  assert.equal((checklist.match(/^[-] \[[x ]\] \*\*BASE-02\*\*/gm)||[]).length,1,
    'must never maintain conflicting BASE-02 decisions');
});
