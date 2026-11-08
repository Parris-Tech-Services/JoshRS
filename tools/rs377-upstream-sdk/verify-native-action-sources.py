#!/usr/bin/env python3
"""Fail-closed native packet/layout source audit, pinned rev377 only.

This verifies the literal server opcodes and current Content interface bindings
used by sdk-action-extensions.mjs. It does NOT claim native gameplay success.
"""
from __future__ import annotations
from pathlib import Path
import argparse
import re
import sys

OPCODES = {
 "IF_BUTTON": 79, "CLOSE_MODAL":110,"RESUME_P_COUNTDIALOG":75,
 "OPPLAYER1":245,"OPPLAYER2":233,"OPPLAYER3":194,"OPPLAYER4":116,"OPPLAYER5":45,
 "OPHELD1":203,"OPHELD5":4,"OPHELDT":36,"OPHELDU":1,
 "OPNPCU":57,"OPNPCT":104,"OPPLAYERT":31,"OPOBJT":83,
 "MESSAGE_PUBLIC":49,"MESSAGE_PRIVATE":227
}
COMPONENTS = {
 "shop_template:inv":3900,"shop_template_side:inv":3823,
 "bank_main:bank":5382,"bank_side:inv":2006,
 "prayer:prayer_thickskin":5609,
 "prayer:prayer_strengthburst":5610,
 "prayer:prayer_clarity":5611,
 "prayer:prayer_rockskin":5612,
 "prayer:prayer_superhumanstrength":5613,
 "prayer:prayer_improvedreflexes":5614,
 "prayer:prayer_rapidrestore":5615,
 "prayer:prayer_rapidheal":5616,
 "prayer:prayer_protectitems":5617,
 "prayer:prayer_steelskin":5618,
 "prayer:prayer_ultimatestrength":5619,
 "prayer:prayer_incrediblereflexes":5620,
 "prayer:prayer_protectfrommagic":5621,
 "prayer:prayer_protectfrommissiles":5622,
 "prayer:prayer_protectfrommelee":5623
}
def required(path:Path)->str:
 if not path.is_file(): raise ValueError('missing native source: '+str(path))
 return path.read_text(encoding='utf-8')
def verify(engine:Path,content:Path)->dict:
 proto=required(engine/'src/network/game/client/ClientGameProt.ts')
 pack=required(content/'pack/interface.pack')
 for name,id in OPCODES.items():
  pattern=rf'\b{re.escape(name)}\s*=\s*new ClientGameProt\({id},\s*[-\d]+\)'
  if not re.search(pattern,proto):
   raise ValueError(f'native ClientGameProt {name} no longer {id}')
 for name,id in COMPONENTS.items():
  if not re.search(rf'(?m)^{id}={re.escape(name)}$',pack):
   raise ValueError(f'native interface pack component changed: {name}')
 shop=required(content/'scripts/shop/scripts/shop.rs2')
 bank=required(content/'scripts/interface_bank/scripts/bank.rs2')
 deposit=required(content/'scripts/interface_bank/scripts/bank_deposit.rs2')
 drop=required(content/'scripts/player/scripts/drop.rs2')
 for side in ['shop_template:inv','shop_template_side:inv']:
  for option,amount in [(2,1),(3,5),(4,10)]:
   pattern=rf'\[inv_button{option},{re.escape(side)}\]\s*@shop_request\([^\r\n]+,\s*{amount}\)'
   if not re.search(pattern,shop):
    raise ValueError(f'shop quantity {side} option {option} no longer {amount}')
 for side,src in [('bank_main:bank',bank),('bank_side:inv',deposit)]:
  for option,amount in [(1,1),(2,5),(3,10),(4,'^max_32bit_int')]:
   if not re.search(rf'\[inv_button{option},{re.escape(side)}\]\s*@bank_(?:withdraw|deposit)\(last_slot,\s*{re.escape(str(amount))}\)',src):
    raise ValueError(f'bank qty native button {side} option {option} changed')
 if '[opheld5,_] ~dropslot(last_slot);' not in drop:
  raise ValueError('legacy drop OPHELD5 handler missing')
 if 'p_countdialog;' not in bank or 'p_countdialog;' not in deposit:
  raise ValueError('actual X quantity dialogue not in bank scripts')
 return {
  'status':'native_377_action_source_contract_passed_not_gameplay',
  'opcodes_checked':len(OPCODES),'interface_components_checked':len(COMPONENTS),
  'native_shop_quantities':'1,5,10','native_bank_quantities':'1,5,10,all,X',
  'real_player_action_execution_verified':False
 }
if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--engine',required=True,type=Path)
 parser.add_argument('--content',required=True,type=Path)
 args=parser.parse_args()
 try:
  print(verify(args.engine,args.content))
 except (OSError,ValueError) as exc:
  print('NATIVE_377_ACTION_SOURCE_AUDIT_FAILED:',exc,file=sys.stderr)
  sys.exit(1)
