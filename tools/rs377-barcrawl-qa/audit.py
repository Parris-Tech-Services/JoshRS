#!/usr/bin/env python3
"""Fail-closed source audit of pinned 377 Barcrawl, NOT live gameplay.
Reads only an isolated disposable Content checkout.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import re
import sys
BARS={
 'bluemoon':'areas/area_varrock/scripts/bartender.rs2',
 'blurberry':'areas/area_gnome/scripts/blurberry.rs2',
 'deadman':'areas/area_brimhaven/scripts/bartender.rs2',
 'dragoninn':'areas/area_yanille/scripts/bartender.rs2',
 'flyinghorse':'areas/area_ardougne_east/scripts/bartender.rs2',
 'forestersarms':'areas/area_seers/scripts/bartender.rs2',
 'jollyboar':'areas/area_varrock/scripts/bartender.rs2',
 'karamjaspirits':'areas/area_karamja/scripts/zambo.rs2',
 'risingsun':'areas/area_falador/scripts/barmaid.rs2',
 'rustyanchor':'areas/area_port_sarim/scripts/bartender.rs2'
}
def audit(content:Path)->dict:
 root=content.resolve(strict=True)
 scripts=root/'scripts'
 if not scripts.is_dir(): raise ValueError('no native scripts directory')
 def read(relative:str)->str:
  path=scripts/relative
  if not path.is_file():raise ValueError('missing native source: '+relative)
  return path.read_text(encoding='utf-8')
 constants=read('quests/quest_barcrawl/configs/quest_barcrawl.constant')
 varp=read('quests/quest_barcrawl/configs/quest_barcrawl.varp')
 script=read('quests/quest_barcrawl/scripts/quest_barcrawl.rs2')
 guard=read('areas/area_barbarian_outpost/scripts/barbarian_outpost_guard.rs2')
 gate=read('areas/area_barbarian_outpost/scripts/outpost_gate.rs2')
 scroll=read('general/scripts/scroll.rs2')
 for name,value in [('barcrawl_not_started',0),('barcrawl_started',1),('barcrawl_complete',2)]:
  if not re.search(rf'(?m)^{re.escape("^"+name)} = {value}$',constants):
   raise ValueError('wrong stage constant: '+name)
 if not re.search(r'\[barcrawl\]\s*scope=perm',varp):
  raise ValueError('barcrawl permanent varp missing')
 if ('getbit_range(%barcrawl, 3, 12)' not in script or
     'calc(pow(2,10) - 1)' not in script):
  raise ValueError('visited_all_bars does not check exactly ten signature bits')
 if '[opheld1,barcrawl_card]' not in script or '@scroll_barcrawl_card;' not in script:
  raise ValueError('barcrawl card inventory interaction missing')
 if 'if(~visited_all_bars = true)' not in guard or '%barcrawl = ^barcrawl_complete;' not in guard:
  raise ValueError('barcrawl guard does not verify signatures and complete stage')
 if '[oploc1,_outpost_gate]' not in gate or '%barcrawl ! ^barcrawl_complete' not in gate:
  raise ValueError('outpost gate stage check missing')
 for bit,(name,relative) in enumerate(BARS.items(),3):
  token='^'+name+'_index'
  if not re.search(rf'(?m)^{re.escape(token)} = {bit}$',constants):
   raise ValueError(f'missing or misnumbered signature {name} at bit {bit}')
  if not re.search(rf'%barcrawl\s*=\s*setbit\(%barcrawl,\s*{re.escape(token)}\)',read(relative)):
   raise ValueError(f'bar {name} does not permanently sign card at {relative}')
  if not re.search(rf'testbit\(%barcrawl,\s*{re.escape(token)}\)',scroll):
   raise ValueError('card scroll does not show '+name)
 return {'status':'source_contract_passed_not_playthrough',
         'pub_signature_handlers':len(BARS),'persistent_varp':True,
         'guard_handoff_source_present':True,'gate_check_source_present':True,
         'real_quest_playthrough_verified':False}
if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--content',type=Path,required=True)
 args=parser.parse_args()
 try:print(audit(args.content))
 except (OSError,ValueError) as error:
  print('BARCRAWL_SOURCE_CONTRACT_FAILED:',str(error),file=sys.stderr)
  sys.exit(1)
