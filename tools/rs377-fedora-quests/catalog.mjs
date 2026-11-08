/**
 * JoshRS Fedora 377 campaign catalogue. SOURCE queue only, never play proof.
 * Reads repository metadata; does not inspect character files, credentials or game.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const REPO_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const QUEST_QUEUE=path.join(REPO_ROOT,'research/rs377/QUEST_QUEUE_2026-11-08.json');
export const nameKey=s=>String(s??'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
function fail(s){throw new Error('quest_catalog_'+s)}
export function readCatalogue(file=QUEST_QUEUE){
 const text=readFileSync(file,'utf8'),data=JSON.parse(text);
 return catalogueFromData(data,createHash('sha256').update(text).digest('hex'));
}
export function catalogueFromData(data,digest='test-fixture'){
 if(!data||!Array.isArray(data.quests)||!Array.isArray(data.miniquests)||
   data.cutoff_revision!==377)fail('not_revision_377');
 if(data.quests.length!==104||data.miniquests.length!==7)fail('unexpected_quest_count');
 const quests=data.quests.map((q,i)=>{
  if(!/^[a-z0-9_]+$/.test(q.quest_id)||!q.name||
    !Number.isInteger(q.release_order)||q.release_order!==i+1||
    !Number.isInteger(q.quest_points)||q.quest_points<0||
    typeof q.varp_or_varbit!=='string'||!Array.isArray(q.required_quests)||
    !Array.isArray(q.required_skills)||!['COMPLETE-VERIFIED','COMPLETE-UNVERIFIED','PARTIAL','STUB','NOT STARTED'].includes(q.status))
     fail('invalid_quest_record_'+i);
  return {id:q.quest_id,name:q.name,kind:'quest',releaseOrder:q.release_order,
   releaseDate:q.release_date,sourceStatus:q.status,
   questPoints:q.quest_points,requiredQuests:[...q.required_quests],
   requiredSkills:[...q.required_skills],startNpc:q.start_npc,
   startLocation:q.start_location,sourceVarps:q.varp_or_varbit.split(/\s*\/\s*/).filter(Boolean),
   contentScriptCount:q.evidence?.rs2_file_count??0};
 });
 const miniquests=data.miniquests.map((q,i)=>{
  if(!/^[a-z0-9_]+$/.test(q.miniquest_id)||!q.name)fail('invalid_miniquest_'+i);
  return {id:q.miniquest_id,name:q.name,kind:'miniquest',
   releaseOrder:105+i,releaseDate:q.release_date,sourceStatus:'RESEARCH_NOT_COMPLETE',
   questPoints:0,requiredQuests:[],requiredSkills:[],
   startNpc:null,startLocation:null,sourceVarps:String(q.varp_or_varbit??'').split(/\s*\/\s*/).filter(Boolean),
   contentScriptCount:null};
 });
 const entries=[...quests,...miniquests],ids=new Set(entries.map(e=>e.id));
 if(ids.size!==111)fail('duplicate_ids');
 const byName=new Map(entries.map(e=>[nameKey(e.name),e.id]));
 for(const entry of entries){
  entry.prerequisites=[];
  entry.unresolvedPrerequisites=[];
  for(const required of entry.requiredQuests){
   const dep=byName.get(nameKey(required));
   if(dep&&dep!==entry.id)entry.prerequisites.push(dep);
   else entry.unresolvedPrerequisites.push(required);
  }
 }
 return {schema:'joshrs377-quest-catalog-v1',sourceDigest:digest,
   revision:377,questCount:quests.length,miniquestCount:miniquests.length,entries};
}

/** Topological queue by real quest requirements, with newest-first preference. */
export function questPlan(catalogue,{newestFirst=true,includeMiniquests=true,filter=null}={}){
 if(!catalogue?.entries||catalogue.revision!==377)fail('bad_plan_source');
 const nodes=catalogue.entries.filter(e=>includeMiniquests||e.kind==='quest');
 const ids=new Set(nodes.map(e=>e.id));
 const map=new Map(nodes.map(e=>[e.id,e]));
 if(filter!==null){
  const found=nodes.find(e=>e.id===filter||nameKey(e.name)===nameKey(filter));
  if(!found)fail('unknown_quest_'+String(filter).slice(0,50));
 }
 const deps=new Map(nodes.map(e=>[e.id,e.prerequisites.filter(p=>ids.has(p))]));
 const selected=filter===null?new Set(ids):new Set([nodes.find(e=>e.id===filter||nameKey(e.name)===nameKey(filter)).id]);
 if(filter!==null){
  const visit=id=>{for(const parent of deps.get(id)||[])if(!selected.has(parent)){selected.add(parent);visit(parent)}};
  visit([...selected][0]);
 }
 const ready=nodes.filter(e=>selected.has(e.id)&&deps.get(e.id).length===0);
 const completed=new Set(),out=[];
 const priority=(a,b)=>{const dates=a.releaseDate.localeCompare(b.releaseDate);return newestFirst?(-dates||b.releaseOrder-a.releaseOrder):(dates||a.releaseOrder-b.releaseOrder)};
 while(ready.length){
  ready.sort(priority);
  const e=ready.shift();
  if(completed.has(e.id))continue;
  completed.add(e.id);out.push(e);
  for(const n of nodes)if(selected.has(n.id)&&!completed.has(n.id)&&
     (deps.get(n.id)||[]).every(d=>completed.has(d))&&!ready.some(x=>x.id===n.id))ready.push(n);
 }
 if(out.length!==selected.size)fail('dependency_cycle_or_missing');
 return out;
}
/** Safe printable inventory status. NEVER infer game playability from source status. */
export function planSummary(plan){
 return {total:plan.length,quests:plan.filter(e=>e.kind==='quest').length,
  miniquests:plan.filter(e=>e.kind==='miniquest').length,
  sourceOnly:plan.filter(e=>e.sourceStatus==='COMPLETE-VERIFIED').length,
  withUnresolvedPrerequisites:plan.filter(e=>e.unresolvedPrerequisites.length).length,
  livePlayableVerified:0,
  guarantee:'Read-only source catalogue, no real account or quest used'};
}
