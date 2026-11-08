import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, validateRoadmap } from './validate-roadmap.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const folder = path.join(root, 'research/parity/roadmap/data');
function loadFiles() {
  return [
    JSON.parse(fs.readFileSync(path.join(folder, 'implementation_backlog_first_100.json'))),
    JSON.parse(fs.readFileSync(path.join(folder, 'dependency_graph.json'))),
    fs.readFileSync(path.join(folder, 'joshrs_gap_inventory_2026-11-08.csv'), 'utf8')
  ];
}
function simple() {
  const a = { id: 'JR-001', title: 'A', description: 'Do A', acceptance: 'Verify A',
    phase: 'P0', likely_paths: ['a'], dependency_ids: [],
    implementation_status: 'NOT_STARTED_OR_NOT_RECONCILED' };
  const b = { ...a, id: 'JR-002', title: 'B', dependency_ids: ['JR-001'] };
  const backlog = { schema: 'joshrs-parity-roadmap-tasks-v1', task_count: 2,
    tasks: [a,b] };
  const graph = { schema: 'joshrs-parity-roadmap-dependency-graph-v1',
    nodes: [{id:a.id},{id:b.id}], edges: [{from:a.id,to:b.id,type:'blocks'}] };
  const csv = [
    'row_id,source_game,source_audit_status,joshrs_status,live_gameplay_verified,reference_evidence,rights_gate,checked_date,source_reference',
    '"seed1","osrs","UNKNOWN","RESEARCH_NOT_COMPLETE","false","SEED","CHECK","2026-11-08","wiki"'
  ].join('\n') + '\n';
  return [backlog, graph, csv];
}
test('real committed roadmap baseline validates without public network or game runtime', () => {
  const result = validateRoadmap(...loadFiles());
  assert.equal(result.tasks, 100);
  assert.equal(result.graph_edges, 228);
  assert.equal(result.category_records, 1281);
  assert.equal(result.status_counts.RESEARCH_NOT_COMPLETE, 1200);
  assert.equal(result.status_counts.SOURCE_IMPLEMENTED_NOT_LIVE_VERIFIED, 77);
});
test('CSV parser respects embedded commas, escaped quotes and rejects missing column', () => {
  const result = parseCsv('name,value\n"a, ""b""","c"\n');
  assert.equal(result.records[0].name, 'a, "b"');
  assert.throws(() => parseCsv('a,b\n1\n'), /columns/);
  assert.throws(() => parseCsv('a\n"unfinished'), /unterminated/);
});
test('valid small DAG and uncertain gap row pass with baseline override', () => {
  assert.equal(validateRoadmap(...simple(), {strictBaseline:false}).graph_acyclic, true);
});
test('cyclic dependency fails even if edges match task dependency fields', () => {
  const [backlog,graph,csv]=simple();
  backlog.tasks[0].dependency_ids=['JR-002'];
  graph.edges.push({from:'JR-002',to:'JR-001',type:'blocks'});
  assert.throws(()=>validateRoadmap(backlog,graph,csv,{strictBaseline:false}),/cycle/);
});
test('claiming VERIFIED_PLAYABLE without live evidence fails closed', () => {
  const [backlog,graph,csv]=simple();
  backlog.tasks[1].implementation_status='VERIFIED_PLAYABLE';
  assert.throws(()=>validateRoadmap(backlog,graph,csv,{strictBaseline:false}),/live evidence/);
});
test('invalid row-count, duplicate IDs and mismatched edges fail', () => {
  const [a,b,c]=simple(); a.tasks[1].id='JR-001';
  assert.throws(()=>validateRoadmap(a,b,c,{strictBaseline:false}),/duplicate/);
  const [x,y,z]=simple(); y.edges=[];
  assert.throws(()=>validateRoadmap(x,y,z,{strictBaseline:false}),/differs/);
});
