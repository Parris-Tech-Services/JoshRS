import json,re,glob,collections,sys
C=sys.argv[1]; blocks={}
for f in glob.glob(C+'/scripts/**/*.loc',recursive=True):
    for b in re.split(r'\n(?=\[)',open(f,encoding='utf-8',errors='replace').read()):
        m=re.match(r'\[(\w+)\]',b.strip())
        if m:
            kv={}; params=[]
            for l in b.strip().split('\n')[1:]:
                if l.startswith('param='): params.append(l[6:])
                elif '=' in l and not l.startswith('//'): k,v=l.split('=',1); kv[k]=v
            kv['_params']=params; blocks[m.group(1)]=kv
# ore of each working rock from mining_table dbrows
ore={}; rows={}
txt=open(glob.glob(C+'/scripts/skill_mining/configs/mine.dbrow')[0]).read()
for b in re.split(r'\n(?=\[)',txt):
    m=re.match(r'\[(\w+)\]',b.strip())
    if not m: continue
    rocks=re.findall(r'data=rock,(\w+)',b); on=re.findall(r'data=ore_name,(.+)',b)
    rows[m.group(1)]={'rocks':rocks,'ore':on[0] if on else None}
    for r in rocks: ore[r]=m.group(1)
col=collections.defaultdict(set)
recs=lambda b:[(b[k],b.get(k[:-1]+'s')) for k in b if re.match(r'recol\dd$',k)]
for r,row in ore.items():
    b=blocks.get(r)
    if b:
        for d,s in recs(b): col[d].add(row)
amb={k:v for k,v in col.items() if len(v)>1}
print('colour->ore entries',len(col),'ambiguous',amb)
d=json.load(open('missing_placed.json'))['oploc']
cand=sorted({x[0] for x in d if x[3] in('Mine','Prospect')})
out={}; stat=collections.Counter()
for n in cand:
    b=blocks[n]; hits={next(iter(col[c])) for c,s in recs(b) if c in col and len(col[c])==1}
    if len(hits)==1: out[n]=hits.pop(); stat['ore:'+rows[out[n]]['ore']]+=1
    elif not recs(b): stat['no-recolour (plain rock)']+=1; out[n]=None
    else: stat['unknown colour']+=1
print(stat)
json.dump({'ore':out,'rows':rows},open('rock_ore.json','w'),indent=0)
# leave-one-out validation on known rocks
ok=bad=none=0; wrong=[]
for r,row in ore.items():
    b=blocks.get(r)
    if not b: continue
    c2=collections.defaultdict(set)
    for r2,row2 in ore.items():
        if r2==r or r2 not in blocks: continue
        for dd,s in recs(blocks[r2]): c2[dd].add(row2)
    hits={next(iter(c2[c])) for c,s in recs(b) if c in c2 and len(c2[c])==1}
    if len(hits)==1:
        if hits=={row}: ok+=1
        else: bad+=1; wrong.append((r,row,hits))
    else: none+=1
print('validation: correct',ok,'wrong',bad,'unclassified',none, wrong[:5])
nl=lambda b:next((p.split(',',1)[1] for p in b['_params'] if p.startswith('next_loc_stage_mining,')),None)
same=diff=nonl=0; ex=[]
for r in ore:
    b=blocks.get(r)
    if not b: continue
    n=nl(b)
    if n is None: nonl+=1; ex.append((r,b.get('model'),'no next_loc',b['_params']))
    elif n==b.get('model'): same+=1
    else: diff+=1; ex.append((r,b.get('model'),n))
print('next_loc==model',same,'different',diff,'none',nonl); [print(' ',e) for e in ex[:12]]
empties=collections.defaultdict(list)
for n,b in blocks.items():
    if 'mining_rock_empty,1' in b['_params']: empties[b.get('model')].append(n)
plain={n for n,v in out.items() if v is None}
for n in plain: empties[blocks[n].get('model')].append(n)
# also: any loc (placed or not) named Rocks with same model and no recolour and no ops besides mine/prospect
plan={}; st=collections.Counter()
for n,row in out.items():
    if row is None: plan[n]={'empty':True}; st['plain->empty rock']+=1; continue
    m=blocks[n].get('model'); e=[x for x in empties.get(m,[]) if x!=n]
    if not e:
        e=[x for x,b in blocks.items() if b.get('model')==m and x!=n and not recs(b) and 'Mine' in b.values()]
    if e: plan[n]={'row':row,'empty':False,'next':sorted(e)[0]}; st['ore + empty found']+=1
    else: plan[n]={'row':row,'next':None}; st['ore, NO empty version']+=1
print(st)
json.dump(plan,open('rock_plan.json','w'),indent=0)
for n,p in list(plan.items())[:6]: print(n,blocks[n].get('model'),p)
lp={a.split('=',1)[1].strip():int(a.split('=')[0]) for a in open(C+'/pack/loc.pack') if '=' in a}
oreCols={c for c,v in col.items() if len(v)==1}
def twin(n):
    m=blocks[n].get('model'); i=lp[n]; best=None
    for x,b in blocks.items():
        if x==n or b.get('model')!=m or x not in lp: continue
        if any(c in oreCols for c,s in recs(b)): continue
        if sorted(s for c,s in recs(b))!=sorted(s for c,s in recs(blocks[n])): continue
        if not re.match(r'(?i)rocks?$|mineral vein|pile of rock',b.get('name','')): continue
        d=abs(lp[x]-i)
        if best is None or d<best[0]: best=(d,x)
    return best
st=collections.Counter()
for n,p in plan.items():
    if p.get('empty') or p.get('next'): continue
    t=twin(n)
    if t and t[0]>60: t=None
    if t: p['next']=t[1]; p['twin_dist']=t[0]; st['twin d<=4' if t[0]<=4 else 'twin far']+=1
    else: st['none']+=1
print(st); json.dump(plan,open('rock_plan.json','w'),indent=0)
for n,p in plan.items():
    if p.get('twin_dist') is not None: print(n,lp[n],'->',p['next'],lp[p['next']],rows[p['row']]['ore'],blocks[p['next']].get('name'),'|',{k:v for k,v in blocks[p['next']].items() if k.startswith('recol')})
catby=collections.defaultdict(collections.Counter)
for r,row in ore.items():
    if r in blocks and blocks[r].get('category'): catby[row][blocks[r]['category']]+=1
print('CATS',{k:dict(v) for k,v in catby.items()})
tw={p['next'] for p in plan.values() if p.get('next')}
print('TWINS',{t:(blocks[t].get('category'),blocks[t]['_params'],blocks[t].get('op1')) for t in sorted(tw)})
