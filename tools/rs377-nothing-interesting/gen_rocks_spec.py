import json,glob,re,sys
C=sys.argv[1]; BS=chr(92)
norm=lambda f:f.replace(BS,'/').split('/content/')[1]
plan=json.load(open('rock_plan.json'))
where={}
for f in glob.glob(C+'/scripts/**/*.loc',recursive=True):
    for m in re.finditer(r'^\[(\w+)\]',open(f,encoding='utf-8',errors='replace').read(),re.M): where[m.group(1)]=norm(f)
locadd={}; dbadd={}; twins=set()
for n,p in sorted(plan.items()):
    if p.get('empty') or not p.get('next'): continue
    locadd.setdefault(where[n],{})[n]=['category=mining_rock_normal',f"param=next_loc_stage_mining,{p['next']}"]
    dbadd.setdefault(p['row'],[]).append(f'data=rock,{n}'); twins.add(p['next'])
for t in sorted(twins):
    if t=='rocks1': continue
    locadd.setdefault(where[t],{})[t]=['category=mining_rock_normal','param=mining_rock_empty,1']
db=norm(glob.glob(C+'/scripts/skill_mining/configs/mine.dbrow')[0])
spec={'note':'Rocks placed on the 377 map with no mining handler. Ore identified by its ore colour (recolNd unique to one ore among working rocks; 74/74 leave-one-out correct). Depleted version = same model + same source colours, no ore colour, nearest id. All fields are server-only.','files':[{'file':f,'add':a} for f,a in locadd.items()]+[{'file':db,'add':dbadd}]}
json.dump(spec,open('nih_rocks.json','w'),indent=1)
print({f['file']:len(f['add']) for f in spec['files']}, sum(len(v) for v in dbadd.values()))
