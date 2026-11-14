import os,re,sys,json,collections
C=sys.argv[1]
defs={'loc':{},'npc':{},'obj':{}}
for root,ds,fs in os.walk(C):
    for f in fs:
        ext=f.rsplit('.',1)[-1]
        if ext not in defs: continue
        cur=None
        for line in open(os.path.join(root,f),encoding='utf-8',errors='replace'):
            line=line.strip()
            m=re.match(r'^\[([^\]]+)\]$',line)
            if m: cur=defs[ext].setdefault(m.group(1),{'ops':{},'iops':{},'cat':None,'name':None,'file':os.path.relpath(os.path.join(root,f),C)}); continue
            if not cur: continue
            m=re.match(r'^(op|iop)([1-5])=(.*)$',line)
            if m: cur['ops' if m.group(1)=='op' else 'iops'][int(m.group(2))]=m.group(3)
            elif line.startswith('category='): cur['cat']=line[9:]
            elif line.startswith('name='): cur['name']=line[5:]
trig=set()
for root,ds,fs in os.walk(C):
    for f in fs:
        if f.endswith('.rs2'):
            for m in re.finditer(r'^\[(\w+),([^\]]+)\]',open(os.path.join(root,f),encoding='utf-8',errors='replace').read(),re.M):
                trig.add((m.group(1),m.group(2)))
def has(t,name,cat):
    return (t,name) in trig or (cat and (t,'_'+cat) in trig) or (t,'_') in trig
out=collections.defaultdict(list)
for kind,tp,key in (('loc','oploc','ops'),('npc','opnpc','ops'),('obj','opobj','ops'),('obj','opheld','iops')):
    for name,d in defs[kind].items():
        for n,label in d[key].items():
            if label.lower() in ('hidden','drop','take','examine'): continue
            if kind=='npc' and label.lower()=='attack': continue
            if not has(f'{tp}{n}',name,d['cat']):
                out[f'{tp}'].append((name,d['name'],n,label,d['file']))
json.dump(out,open(sys.argv[2],'w'),indent=0)
for k,v in out.items(): print(k,len(v))
# placement filter
def pack(n): return {int(a):b for a,b in (l.rstrip('\n').split('=',1) for l in open(os.path.join(C,'pack',n+'.pack')) if '=' in l)}
lp,np_=pack('loc'),pack('npc')
placed={'loc':collections.Counter(),'npc':collections.Counter()}
import glob
for f in glob.glob(os.path.join(C,'maps','*.jm2')):
    sec=None
    for l in open(f):
        if l.startswith('===='): sec=l.strip('= \n'); continue
        if sec in('LOC','NPC') and ':' in l:
            i=int(l.split(':')[1].split()[0]); nm=(lp if sec=='LOC' else np_).get(i)
            if nm: placed[sec.lower()][nm]+=1
spawned=set()
for root,ds,fs in os.walk(C):
    for f in fs:
        if f.endswith('.rs2'):
            spawned|=set(re.findall(r'\b(?:loc_add|loc_change|npc_add|npc_changetype)\s*\([^,]*,\s*(\w+)',open(os.path.join(root,f),encoding='utf-8',errors='replace').read()))
res={}
for k,v in out.items():
    kind={'oploc':'loc','opnpc':'npc'}.get(k)
    res[k]=[x for x in v if kind is None or placed[kind][x[0]]>0 or x[0] in spawned]
    print('placed',k,len(res[k]))
json.dump(res,open(sys.argv[2].replace('.json','_placed.json'),'w'),indent=0)
for k in ('oploc','opnpc'):
    c=collections.Counter(x[3] for x in res[k]); print(k,c.most_common(25))
