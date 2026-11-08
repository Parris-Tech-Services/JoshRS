#!/usr/bin/env node
/**
 * JoshRS parity roadmap integrity validator. Read-only, offline, no account/save access.
 *   node tools/parity-inventory/validate-roadmap.mjs
 *   node --test tools/parity-inventory/validate-roadmap.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseCsv(csv) {
  if (typeof csv !== 'string') throw new Error('CSV input required');
  const parsed = [];
  let cells = [], field = '', quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (quoted && csv[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      cells.push(field); field = '';
    } else if ((ch === '\r' || ch === '\n') && !quoted) {
      if (ch === '\r' && csv[i + 1] === '\n') i++;
      cells.push(field);
      if (cells.some(v => v.length)) parsed.push(cells);
      cells = []; field = '';
    } else field += ch;
  }
  if (quoted) throw new Error('CSV contains unterminated quote');
  if (field || cells.length) { cells.push(field); parsed.push(cells); }
  if (!parsed.length) throw new Error('empty CSV');
  const headers = parsed.shift();
  if (new Set(headers).size !== headers.length) throw new Error('duplicate CSV headers');
  const records = parsed.map((record, i) => {
    if (record.length !== headers.length) {
      throw new Error('row ' + (i + 2) + ' has ' + record.length + ' columns, expected ' + headers.length);
    }
    return Object.fromEntries(headers.map((key, j) => [key, record[j]]));
  });
  return { headers, records };
}
export function validateRoadmap(backlog, graph, gapCsv, { strictBaseline = true } = {}) {
  if (backlog?.schema !== 'joshrs-parity-roadmap-tasks-v1' ||
      graph?.schema !== 'joshrs-parity-roadmap-dependency-graph-v1') {
    throw new Error('schema mismatch');
  }
  if (!Array.isArray(backlog.tasks) || !Array.isArray(graph.edges) || !Array.isArray(graph.nodes)) {
    throw new Error('invalid backlog graph structure');
  }
  const tasks = backlog.tasks;
  if (tasks.length !== backlog.task_count) throw new Error('task_count mismatch');
  const ids = new Set(tasks.map(t => t.id));
  if (ids.size !== tasks.length) throw new Error('duplicate task IDs');
  const expected = new Set();
  for (const task of tasks) {
    if (!/^JR-\d{3,}$/.test(task.id) ||
        !task.title || !task.description || !task.acceptance ||
        !task.phase || !task.likely_paths?.length || !Array.isArray(task.dependency_ids)) {
      throw new Error('incomplete task ' + task.id);
    }
    if (!['NOT_STARTED_OR_NOT_RECONCILED', 'IMPLEMENTATION_IN_PROGRESS', 'BLOCKED',
      'SOURCE_IMPLEMENTED_NOT_LIVE_VERIFIED', 'VERIFIED_PLAYABLE'].includes(task.implementation_status)) {
      throw new Error('invalid implementation status ' + task.id);
    }
    if (task.implementation_status === 'VERIFIED_PLAYABLE' && !task.live_evidence_uri) {
      throw new Error('a playable task needs live evidence: ' + task.id);
    }
    for (const dep of task.dependency_ids) {
      if (!ids.has(dep) || dep === task.id) throw new Error('invalid task dependency ' + task.id + ':' + dep);
      expected.add(dep + '>' + task.id);
    }
  }
  const actual = new Set(graph.edges.map(e => {
    if (e.type !== 'blocks') throw new Error('invalid edge type');
    return e.from + '>' + e.to;
  }));
  if (actual.size !== graph.edges.length ||
      actual.size !== expected.size ||
      [...expected].some(e => !actual.has(e))) throw new Error('dependency graph differs from tasks');
  const graphIds = new Set(graph.nodes.map(n => n.id));
  if (graphIds.size !== tasks.length || [...ids].some(id => !graphIds.has(id))) {
    throw new Error('graph nodes differ from tasks');
  }

  // Kahn's algorithm, no assumption that numeric task order is always topological.
  const indegree = new Map([...ids].map(id => [id, 0]));
  const links = new Map([...ids].map(id => [id, []]));
  for (const edge of graph.edges) {
    links.get(edge.from)?.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1);
  }
  const ready = [...indegree].filter(([, n]) => n === 0).map(([id]) => id);
  let traversed = 0;
  while (ready.length) {
    const id = ready.pop();
    traversed++;
    for (const to of links.get(id) || []) {
      const left = indegree.get(to) - 1;
      indegree.set(to, left);
      if (left === 0) ready.push(to);
    }
  }
  if (traversed !== tasks.length) throw new Error('dependency cycle');

  const { headers, records } = parseCsv(gapCsv);
  for (const field of ['row_id', 'source_game', 'source_audit_status', 'joshrs_status',
    'live_gameplay_verified', 'reference_evidence', 'rights_gate', 'checked_date']) {
    if (!headers.includes(field)) throw new Error('missing gap column: ' + field);
  }
  const rowIds = new Set(), statuses = new Map(), sources = new Map();
  const allowed = new Set(['VERIFIED_PLAYABLE', 'SOURCE_IMPLEMENTED_NOT_LIVE_VERIFIED',
    'PARTIALLY_IMPLEMENTED', 'MISSING', 'INCOMPATIBLE_WITH_CURRENT_CLIENT',
    'DEPENDENCY_BLOCKED', 'RIGHTS_REVIEW_REQUIRED', 'HISTORICALLY_NOT_APPLICABLE',
    'RESEARCH_NOT_COMPLETE']);
  for (const row of records) {
    if (!row.row_id || rowIds.has(row.row_id)) throw new Error('duplicate/missing gap row ID: ' + row.row_id);
    rowIds.add(row.row_id);
    if (!allowed.has(row.joshrs_status)) throw new Error('invalid gap status ' + row.joshrs_status);
    if (row.live_gameplay_verified !== 'false' && row.live_gameplay_verified !== 'true') {
      throw new Error('invalid live-gameplay boolean');
    }
    if (row.joshrs_status === 'VERIFIED_PLAYABLE' &&
        (row.live_gameplay_verified !== 'true' || !row.live_evidence_uri)) {
      throw new Error('live proof required: ' + row.row_id);
    }
    if (!row.source_reference || !row.rights_gate) throw new Error('unsourced gap row ' + row.row_id);
    statuses.set(row.joshrs_status, (statuses.get(row.joshrs_status) || 0) + 1);
    const source = row.row_id.split(':')[0];
    sources.set(source, (sources.get(source) || 0) + 1);
  }
  if (strictBaseline) {
    if (tasks.length !== 100 || graph.edges.length !== 228 || records.length !== 1281 ||
        statuses.get('SOURCE_IMPLEMENTED_NOT_LIVE_VERIFIED') !== 77 ||
        statuses.get('PARTIALLY_IMPLEMENTED') !== 4 ||
        statuses.get('RESEARCH_NOT_COMPLETE') !== 1200) {
      throw new Error('2026-11-08 baseline counts changed; update audit and tests deliberately');
    }
  }
  return { tasks: tasks.length, graph_edges: graph.edges.length,
    category_records: records.length, graph_acyclic: true,
    source_counts: Object.fromEntries(sources),
    status_counts: Object.fromEntries(statuses) };
}

const me = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === me) {
  try {
    const root = path.resolve(path.dirname(me), '../..');
    const rel = 'research/parity/roadmap/data';
    const backlog = JSON.parse(fs.readFileSync(path.join(root, rel, 'implementation_backlog_first_100.json')));
    const graph = JSON.parse(fs.readFileSync(path.join(root, rel, 'dependency_graph.json')));
    const gap = fs.readFileSync(path.join(root, rel, 'joshrs_gap_inventory_2026-11-08.csv'), 'utf8');
    const result = validateRoadmap(backlog, graph, gap);
    console.log(JSON.stringify({ result: 'VALID_SOURCE_RESEARCH_SCHEMA_ONLY',
      ...result, warning: 'No 377 or modern game was tested by this validator' }, null, 2));
  } catch (err) {
    console.error('Parity roadmap validation FAILED: ' + err.message);
    process.exitCode = 1;
  }
}
