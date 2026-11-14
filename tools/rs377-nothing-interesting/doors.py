import json,re,glob,collections,sys
C=sys.argv[1]; blocks={}; where={}; BS=chr(92)
for f in glob.glob(C+'/scripts/**/*.loc',recursive=True):
    for b in re.split(r'\n(?=\[)',open(f,encoding='utf-8',errors='replace').read()):
        m=re.match(r'\[(\w+)\]',b.strip())
        if m:
            kv={'_params':[]}
            for l in b.strip().split('\n')[1:]:
                if l.startswith('param='): kv['_params'].append(l[6:])
                elif '=' in l and not l.startswith('//'): k,v=l.split('=',1); kv[k]=v
            blocks[m.group(1)]=kv; where[m.group(1)]=f.replace(BS,'/').split('/content/')[1]
lp={a.split('=',1)[1].strip():int(a.split('=')[0]) for a in open(C+'/pack/loc.pack') if '=' in a}; byid={v:k for k,v in lp.items()}
recs=lambda b:sorted((k,v) for k,v in b.items() if k.startswith('recol'))
d=json.load(open('missing_placed.json'))['oploc']
cands=sorted({x[0] for x in d if x[3]=='Open' and x[2]==1})
st=collections.Counter(); out={}
for n in cands:
    if n not in blocks: continue
    b=blocks[n]; nm=b.get('name','')
    i=lp[n]; twin=None
    for j in (i+1,i-1,i+2):
        t=byid.get(j); tb=blocks.get(t)
        if tb and tb.get('op1')=='Close' and tb.get('name')==nm and tb.get('model')==b.get('model') and recs(tb)==recs(b): twin=t; break
    kind='generic' if re.match(r'^loc_\d+$',n) and where[n].endswith('all.loc') else 'named'
    st[(nm if nm in('Door','Gate','Large door','Doors') else 'other', kind, 'twin' if twin else 'no-twin')]+=1
    out[n]={'name':nm,'twin':twin,'kind':kind,'file':where[n],'desc':b.get('desc'),'twin_cat':blocks.get(twin,{}).get('category') if twin else None}
for k,v in sorted(st.items(),key=lambda x:-x[1]): print(v,k)
json.dump(out,open('door_cands.json','w'),indent=0)
pick=['loc_10527','loc_10529','loc_14923','loc_5126','misc_viking_abode_door_low','viking_abode_door','ahoy_harbour_door','fenk_door_mirror','wild_door']+[n for n in out if n.startswith('dwarf_keldagrim_door')]
bymodel=collections.defaultdict(list)
for n,b in blocks.items():
    if b.get('category','').endswith('door_closed'): bymodel[b.get('model')].append((n,b['category']))
for n in pick:
    b=blocks[n]; t=out[n]['twin']; tb=blocks[t]
    print(n,'model',b.get('model'),'| twin',t,'cat',tb.get('category'),tb['_params'][:2],'| same-model handled:',bymodel.get(b.get('model'),[])[:3], '| params',b['_params'])
