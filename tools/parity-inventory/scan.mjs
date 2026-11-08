#!/usr/bin/env node
/**
 * Research-only MediaWiki category-member enumerator for OSRS and RS3.
 *
 * Stores metadata (page IDs, titles, namespace, references), NOT page text,
 * assets, quest dialogue, art or code. A category member != an in-game entity.
 * Explicit truncation/resume state; never silently infer a complete inventory.
 *
 * Node >=20. Usage:
 *   node tools/parity-inventory/scan.mjs --game osrs --category Quests --depth 1 --budget 25 --out research/parity/exports/osrs-quests.json --live
 *   node tools/parity-inventory/scan.mjs --resume research/parity/exports/osrs-quests.json --budget 25 --live
 *   node --test tools/parity-inventory/scan.test.mjs
 *
 * Request etiquette: <=1 request per second by default, helpful User-Agent,
 * Retry-After support for 429/503. Respect each source site's policies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WIKIS = Object.freeze({
  osrs: 'https://oldschool.runescape.wiki/api.php',
  rs3: 'https://runescape.wiki/api.php'
});
export const SCHEMA = 'joshrs-wiki-category-metadata-v1';
const AGENT = 'JoshRSParityResearch/0.1 (https://github.com/Parris-Tech-Services/JoshRS; metadata-only)';

export function categoryTitle(name) {
  const v = String(name || '').trim();
  if (!v || v.includes('\n') || v.length > 200) throw new Error('invalid category');
  return v.startsWith('Category:') ? v : 'Category:' + v;
}
export function makeRequestUrl(game, item) {
  if (!Object.hasOwn(WIKIS, game)) throw new Error('unsupported wiki');
  const u = new URL(WIKIS[game]);
  const params = {
    action: 'query', list: 'categorymembers', cmtitle: item.title,
    cmtype: 'page|subcat', cmlimit: 'max', format: 'json', formatversion: '2'
  };
  Object.assign(params, item.continuation || {});
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  return u.toString();
}
export function emptyState(game, categories, depth = 0) {
  if (!Object.hasOwn(WIKIS, game)) throw new Error('unsupported wiki');
  if (!Number.isInteger(depth) || depth < 0 || depth > 3) throw new Error('invalid depth');
  const roots = [...new Set(categories.map(categoryTitle))];
  if (!roots.length) throw new Error('at least one category required');
  return {
    schema: SCHEMA, game, roots, recursive_depth: depth,
    checked_at_utc: null, category_membership_only: true,
    complete: false, error: null, requests: 0,
    root_category_count: roots.length, categories_visited: [],
    queued_categories: roots.map(title => ({ title, depth: 0, continuation: null })),
    seen_categories: [...roots], page_index: {}, duplicates: 0,
    caveat: 'MediaWiki category members, not a verified exhaustive game-entity inventory. Subcategories/redirects/variant IDs can be outside this traversal.'
  };
}

export function ingestCategoryPage(state, response) {
  const queued = state.queued_categories[0];
  if (!queued) throw new Error('no pending category');
  if (!response || !response.query || !Array.isArray(response.query.categorymembers)) {
    throw new Error('invalid MediaWiki response / categorymembers unavailable');
  }
  const entries = response.query.categorymembers;
  const seen = new Set(state.seen_categories);
  for (const item of entries) {
    if (!Number.isInteger(item.pageid) || typeof item.title !== 'string') {
      throw new Error('bad MediaWiki member');
    }
    if (item.ns === 14 && queued.depth < state.recursive_depth) {
      if (!seen.has(item.title)) {
        seen.add(item.title);
        state.seen_categories.push(item.title);
        state.queued_categories.push({ title: item.title, depth: queued.depth + 1, continuation: null });
      }
    }
    if (item.ns === 0) {
      const key = String(item.pageid);
      const old = state.page_index[key];
      if (old) {
        state.duplicates += 1;
        if (!old.categories.includes(queued.title)) old.categories.push(queued.title);
      } else {
        state.page_index[key] = {
          id: item.pageid, title: item.title, ns: item.ns, categories: [queued.title],
          reference_url: (state.game === 'osrs' ? 'https://oldschool.runescape.wiki/w/' : 'https://runescape.wiki/w/')
            + encodeURIComponent(item.title.replace(/ /g, '_'))
        };
      }
    }
  }
  state.requests += 1;
  state.checked_at_utc = new Date().toISOString();
  const continuation = response.continue && typeof response.continue.cmcontinue === 'string'
    ? response.continue : null;
  if (continuation) {
    queued.continuation = continuation;
  } else {
    state.categories_visited.push(queued.title);
    state.queued_categories.shift();
  }
  state.complete = state.queued_categories.length === 0;
  return state;
}

export async function scanCategoryMembers({
  state, budget = 25, fetchJson, onCheckpoint = () => {}, delay = async () => {}
}) {
  if (!state || state.schema !== SCHEMA) throw new Error('invalid checkpoint');
  if (!Number.isInteger(budget) || budget < 1 || budget > 10000) throw new Error('invalid request budget');
  if (typeof fetchJson !== 'function') throw new Error('fetchJson required');
  let used = 0;
  while (state.queued_categories.length && used < budget) {
    const url = makeRequestUrl(state.game, state.queued_categories[0]);
    let response;
    try {
      response = await fetchJson(url);
      ingestCategoryPage(state, response);
      state.error = null;
    } catch (error) {
      state.error = String(error && error.message || error);
      state.complete = false;
      await onCheckpoint(state);
      throw error;
    }
    used += 1;
    await onCheckpoint(state);
    if (state.queued_categories.length && used < budget) await delay();
  }
  state.complete = state.queued_categories.length === 0;
  return state;
}

export async function liveFetchJson(url) {
  let tries = 0;
  while (tries++ < 4) {
    const res = await fetch(url, {
      headers: { 'User-Agent': AGENT, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000)
    });
    if ((res.status === 429 || res.status === 503) && tries < 4) {
      const retry = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(retry) && retry > 0
        ? Math.min(120000, Math.ceil(retry * 1000))
        : Math.min(60000, 5000 * 2 ** (tries - 1));
      await new Promise(resolve => setTimeout(resolve, wait));
      continue;
    }
    if (!res.ok) throw new Error('wiki HTTP ' + res.status + ' at ' + new URL(url).host);
    const data = await res.json();
    if (data.error) throw new Error('MediaWiki API: ' + JSON.stringify(data.error));
    return data;
  }
  throw new Error('wiki retries exceeded');
}

function saveCheckpoint(out, state) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = out + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({
    ...state, unique_category_member_pages: Object.keys(state.page_index).length
  }, null, 2) + '\n');
  fs.renameSync(tmp, out);
}
function getOption(args, name, fallback) {
  const at = args.indexOf(name);
  if (at === -1) return fallback;
  if (at + 1 >= args.length) throw new Error('missing value for ' + name);
  return args[at + 1];
}
async function main(args) {
  if (!args.includes('--live')) {
    throw new Error('pass --live to access wiki; no network operation was made');
  }
  const resume = getOption(args, '--resume', null);
  const out = resume || getOption(args, '--out', null);
  if (!out) throw new Error('set --out or --resume');
  const budget = Number(getOption(args, '--budget', '25'));
  const pauseMs = Number(getOption(args, '--delay-ms', '1000'));
  if (!Number.isInteger(pauseMs) || pauseMs < 1000 || pauseMs > 60000) throw new Error('delay must be 1000..60000ms');
  let state;
  if (resume) {
    state = JSON.parse(fs.readFileSync(resume, 'utf8'));
    if (state.schema !== SCHEMA) throw new Error('checkpoint schema mismatch');
  } else {
    const game = getOption(args, '--game', null);
    const cats = args.flatMap((arg, i) => arg === '--category' ? [args[i + 1]] : []);
    state = emptyState(game, cats, Number(getOption(args, '--depth', '0')));
  }
  await scanCategoryMembers({
    state, budget, fetchJson: liveFetchJson,
    onCheckpoint: s => saveCheckpoint(out, s),
    delay: () => new Promise(resolve => setTimeout(resolve, pauseMs))
  });
  saveCheckpoint(out, state);
  console.log(JSON.stringify({
    file: out, game: state.game, api_requests_total: state.requests,
    unique_category_member_pages: Object.keys(state.page_index).length,
    categories_finished: state.categories_visited.length,
    categories_pending: state.queued_categories.length,
    complete_traversal: state.complete,
    warning: 'CATEGORY MEMBERSHIP ONLY; not game completeness or JoshRS missing-feature proof'
  }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(process.argv.slice(2)).catch(err => {
    console.error('Research scan incomplete: ' + err.message);
    process.exitCode = 1;
  });
}
