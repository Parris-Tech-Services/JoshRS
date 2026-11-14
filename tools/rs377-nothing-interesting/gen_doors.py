import json,re,glob,sys,collections
C=sys.argv[1]
cand=json.load(open('door_cands.json'))
pick=['loc_10527','loc_10529','loc_14923','loc_5126','misc_viking_abode_door_low','viking_abode_door','ahoy_harbour_door','fenk_door_mirror','wild_door']+sorted(n for n in cand if n.startswith('dwarf_keldagrim_door'))
locadd=collections.defaultdict(dict)
for n in pick:
    v=cand[n]; rev='reverse_' if 'mirror' in n else ''
    locadd[v['file']][n]=[f'category={rev}door_closed',f"param=next_loc_stage,{v['twin']}"]
    locadd[v['file']][v['twin']]=[f'category={rev}door_opened',f'param=next_loc_stage,{n}']
spec={'note':'Ordinary closed doors placed on the 377 map with no handler, given the standard door categories and their existing open twin (same name, model and colours, op1 Close, adjacent id). Quest-gated, locked, magic and double doors are excluded. Hinge direction is not verified visually.','files':[{'file':f,'add':a} for f,a in locadd.items()]}
json.dump(spec,open('nih_doors.json','w'),indent=1)
lp={a.split('=',1)[1].strip():int(a.split('=')[0]) for a in open(C+'/pack/loc.pack') if '=' in a}; ids={lp[n]:n for n in pick}
cases=[]; side={0:(-1,0),1:(0,1),2:(1,0),3:(0,-1)}
for f in sorted(glob.glob(C+'/maps/*.jm2')):
    mx,mz=map(int,re.findall(r'm(\d+)_(\d+)',f)[0]); sec=None
    for l in open(f):
        if l.startswith('===='): sec=l.strip('= \n'); continue
        if sec=='LOC' and ':' in l:
            a,b=l.split(':'); p=b.split(); i=int(p[0])
            if i in ids:
                lv,x,z=map(int,a.split()); shape=int(p[1]) if len(p)>1 else 10; ang=int(p[2]) if len(p)>2 else 0
                X,Z=mx*64+x,mz*64+z
                if shape!=0: continue
                dx,dz=side[ang]
                cases.append({'loc':i,'name':ids[i],'op':1,'x':X,'z':Z,'level':lv,'door':{'from':[X+dx,Z+dz],'to':[X,Z]},'angle':ang})
json.dump(cases,open('door_cases.json','w'),indent=0)
print(len(pick),'doors',sum(len(a) for a in locadd.values()),'blocks',len(cases),'placements')
