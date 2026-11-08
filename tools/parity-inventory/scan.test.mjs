import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WIKIS, categoryTitle, makeRequestUrl, emptyState,
  ingestCategoryPage, scanCategoryMembers
} from './scan.mjs';

test('wiki endpoints are explicitly allowlisted and categories normalised', () => {
  assert.equal(Object.keys(WIKIS).length, 2);
  assert.equal(categoryTitle('Quests'), 'Category:Quests');
  assert.equal(categoryTitle('Category:Quests'), 'Category:Quests');
  assert.throws(() => emptyState('unknown', ['Quests']), /unsupported/);
  assert.throws(() => categoryTitle(''), /invalid/);
  const url = new URL(makeRequestUrl('osrs', {
    title: 'Category:Quests', continuation: { cmcontinue: 'next|a', continue: '-||' }
  }));
  assert.equal(url.searchParams.get('cmtitle'), 'Category:Quests');
  assert.equal(url.searchParams.get('cmcontinue'), 'next|a');
  assert.equal(url.searchParams.get('cmtype'), 'page|subcat');
});

test('traversal keeps continuation, recurses, deduplicates, and resumes across budgets', async () => {
  const state = emptyState('osrs', ['Quests'], 1);
  const pages = [
    { query: { categorymembers: [
      { pageid: 10, ns: 0, title: 'Quest A' },
      { pageid: 1000, ns: 14, title: 'Category:Quest subtypes' }
    ] }, continue: { cmcontinue: 'next|1', continue: '-||' } },
    { query: { categorymembers: [
      { pageid: 10, ns: 0, title: 'Quest A' },
      { pageid: 11, ns: 0, title: 'Quest B' }
    ] } },
    { query: { categorymembers: [
      { pageid: 11, ns: 0, title: 'Quest B' },
      { pageid: 12, ns: 0, title: 'Quest C' },
      { pageid: 1001, ns: 14, title: 'Category:Too deep' }
    ] } }
  ];
  const seen = [];
  const fetchJson = async url => {
    seen.push(new URL(url));
    return pages.shift();
  };
  await scanCategoryMembers({ state, budget: 2, fetchJson });
  assert.equal(state.complete, false);
  assert.equal(state.queued_categories.length, 1);
  assert.equal(Object.keys(state.page_index).length, 2);
  await scanCategoryMembers({ state, budget: 2, fetchJson });
  assert.equal(state.complete, true);
  assert.equal(state.requests, 3);
  assert.equal(state.categories_visited.length, 2);
  assert.equal(state.page_index['10'].categories[0], 'Category:Quests');
  assert.deepEqual(state.page_index['11'].categories, ['Category:Quests', 'Category:Quest subtypes']);
  assert.equal(state.page_index['12'].title, 'Quest C');
  assert.equal(state.duplicates, 2);
  assert.equal(state.seen_categories.includes('Category:Too deep'), false);
  assert.equal(seen[1].searchParams.get('cmcontinue'), 'next|1');
  assert.equal(seen[2].searchParams.get('cmtitle'), 'Category:Quest subtypes');
});

test('truncation never says complete; continuation is preserved', () => {
  const state = emptyState('rs3', ['Items']);
  ingestCategoryPage(state, { query: { categorymembers: [
    { pageid: 13, ns: 0, title: 'Sword' }
  ] }, continue: { cmcontinue: 'cursor', continue: '-||' } });
  assert.equal(state.complete, false);
  assert.equal(state.queued_categories[0].continuation.cmcontinue, 'cursor');
  assert.equal(state.page_index['13'].id, 13);
});

test('bad data fails closed without counting a completed page', async () => {
  const state = emptyState('rs3', ['NPCs']);
  let saved;
  await assert.rejects(scanCategoryMembers({
    state, budget: 1,
    fetchJson: async () => ({ invalid: true }),
    onCheckpoint: s => { saved = s; }
  }), /invalid MediaWiki response/);
  assert.equal(state.complete, false);
  assert.equal(state.requests, 0);
  assert.equal(state.queued_categories.length, 1);
  assert.equal(saved.error.includes('invalid MediaWiki'), true);
});

test('invalid member and invalid budgets are rejected', async () => {
  const state = emptyState('osrs', ['Quests']);
  assert.throws(() => ingestCategoryPage(state, {
    query: { categorymembers: [{ pageid: '1', ns: 0, title: 'Bad id' }] }
  }), /bad MediaWiki member/);
  await assert.rejects(scanCategoryMembers({
    state, budget: 0, fetchJson: async () => ({})
  }), /invalid request budget/);
});
