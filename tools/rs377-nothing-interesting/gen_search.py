import json,re,collections,sys
d=json.load(open('missing_placed.json'))['oploc']
lab={'Crate':'nih_search_crate','Crates':'nih_search_crates','Boxes':'nih_search_boxes','Bookcase':'search_bookcase','Old Bookshelf':'search_bookcase','Bamboo Bookcase':'search_bookcase','Cupboard':'search_cupboard'}
generic=re.compile(r'^(loc_\d+|crate\w*|crates\w*|boxes\w*|bookcase\w*|bookshelf_old\w*|cupboard\w*)$')
quest=re.compile(r'withsphinx|movedin')
sel=[x for x in d if x[3].lower()=='search' and x[1] in lab and generic.match(x[0]) and not quest.search(x[0])]
out=["// Generated: generic searchable furniture that had no handler. Reuses the game's standard search","// behaviour for that furniture type (crates/crates/boxes from general_use/scripts/crates.rs2,","// bookcases and cupboards from their general_use handlers).",""]
for nm,name,op,label,f in sorted(sel):
    out+=[f"[oploc{op},{nm}] @{lab[name]}; // {name}"]
out+=["",
"""[label,nih_search_crate]
if (random(^findsomethingnice_chance) = 0 & ~in_tutorial_island(coord) = false) {
    mes("You search the crate...");
    p_delay(2);
    ~findsomethingnice;
    return;
}
mes("You search the crate but find nothing.");

[label,nih_search_crates]
if (random(^findsomethingnice_chance) = 0 & ~in_tutorial_island(coord) = false) {
    mes("You search the crates...");
    p_delay(2);
    ~findsomethingnice;
    return;
}
mes("You search the crates but find nothing of value.");

[label,nih_search_boxes]
if (random(^findsomethingnice_chance) = 0 & ~in_tutorial_island(coord) = false) {
    mes("You search the boxes...");
    p_delay(2);
    ~findsomethingnice;
    return;
}
mes("There is nothing interesting in these boxes.");
"""]
open('nih_search.rs2','w').write('\n'.join(out)); print(len(sel)); [print(' ',x[0],x[1],x[2]) for x in sorted(sel)]
