import json,os,re,glob,sys,collections
C=sys.argv[1]; miss=json.load(open('missing_placed.json'))['oploc']
def pack(n): return {b:int(a) for a,b in (l.rstrip('\n').split('=',1) for l in open(os.path.join(C,'pack',n+'.pack')) if '=' in l)}
lp=pack('loc'); idn={v:k for k,v in lp.items()}
# all loc defs names/ops
names={}
for f in glob.glob(C+'/**/*.loc',recursive=True):
    cur=None
    for l in open(f,encoding='utf-8',errors='replace'):
        m=re.match(r'^\[(\w+)\]',l)
        if m: cur=m.group(1); names.setdefault(cur,{'name':None,'ops':{}}); continue
        if cur and l.startswith('name='): names[cur]['name']=l[5:].strip()
        m=re.match(r'^op([1-5])=(.*)',l)
        if cur and m: names[cur]['ops'][int(m.group(1))]=m.group(2).strip()
# placements
pl=collections.defaultdict(list); bycoord={}
for f in glob.glob(C+'/maps/*.jm2'):
    mx,mz=map(int,re.findall(r'm(\d+)_(\d+)',f)[0]); sec=None
    for l in open(f):
        if l.startswith('===='): sec=l.strip('= \n'); continue
        if sec=='LOC' and ':' in l:
            a,b=l.split(':'); lv,x,z=map(int,a.split()); p=b.split(); i=int(p[0])
            X,Z=mx*64+x,mz*64+z; nm=idn.get(i); pl[nm].append((lv,X,Z)); bycoord.setdefault((lv,X,Z),[]).append(nm)
climbing=lambda nm: any(re.match(r'(?i)climb',o) for o in names.get(nm,{}).get('ops',{}).values())
def near(lv,X,Z,r=3):
    out=[]
    for dx in range(-r,r+1):
        for dz in range(-r,r+1):
            for nm in bycoord.get((lv,X+dx,Z+dz),[]):
                if climbing(nm): out.append((nm,lv,X+dx,Z+dz))
    return out
rows=[]
for nm,_,op,label,_f in miss:
    if not re.match(r'(?i)climb',label): continue
    for (lv,X,Z) in pl.get(nm,[]):
        up=label.lower()=='climb-up' or (label.lower()=='climb' and 'Climb-down' not in names[nm]['ops'].values() and 'up' in json.dumps(names[nm]).lower())
        cands=[]
        if label.lower()=='climb-up': cands=[('up',lv+1,X,Z)] + ([('up-surface',0,X,Z-6400)] if Z>6400 else [])
        elif label.lower()=='climb-down': cands=[('down',lv-1,X,Z)] if lv>0 else [('down-dungeon',0,X,Z+6400)]
        else: cands=[('up',lv+1,X,Z)]+([('down',lv-1,X,Z)] if lv>0 else [('down-dungeon',0,X,Z+6400)])
        found=[(k,near(l2,x2,z2)) for k,l2,x2,z2 in cands if l2>=0]
        rows.append({'loc':nm,'name':names[nm]['name'],'op':op,'label':label,'pos':(lv,X,Z),'pairs':[(k,p) for k,p in found if p]})
json.dump(rows,open('ladder_rows.json','w'),indent=0)
c=collections.Counter(('paired' if r['pairs'] else 'unpaired') for r in rows); print(len(rows),c)
for r in rows[:8]: print(r)
