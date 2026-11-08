/**
 * Exhaustive action-surface contract at pinned upstream
 * MaxBittker/rs-sdk@db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb.
 * Each entry states which boundary is available. Source mapping is NOT
 * an assertion that the native 377 game performed the effect.
 *
 * native: normal 377 server packet can be produced from authoritative state
 * guarded: packet possible only when optional UI/client evidence is grounded
 * read: read-only state observation, no gameplay packet
 * client: cannot drive a GUI-local action through the server TCP boundary
 * absent: mechanic not found in the pinned revision-377 world
 */
const types=[
 // Original eleven
 ['none','read'],['wait','read'],['talkToNpc','native'],
 ['interactNpc','native'],['clickDialogOption','guarded'],
 ['walkTo','native'],['useInventoryItem','native'],
 ['pickupItem','native'],['interactGroundItem','native'],
 ['interactLoc','native'],['useItemOnLoc','native'],
 // Expanded, source-pinned normal 377 packet mappings
 ['interactPlayer','native'],['clickComponent','guarded'],
 ['clickComponentWithOption','guarded'],
 ['useEquipmentItem','guarded'],['dropItem','native'],
 ['shopBuy','native'],['shopSell','native'],['closeShop','native'],
 ['closeModal','native'],['setCombatStyle','guarded'],
 ['useItemOnItem','native'],['useItemOnNpc','native'],
 ['say','native'],['privateMessage','native'],
 ['spellOnNpc','guarded'],['spellOnPlayer','guarded'],
 ['spellOnItem','guarded'],['spellOnGroundItem','guarded'],
 ['bankDeposit','native'],['bankWithdraw','native'],
 ['submitCountDialog','guarded'],['togglePrayer','native'],
 ['scanNearbyLocs','read'],['scanGroundItems','read'],
 // Requires enhanced client state or an absent 377 feature
 ['acceptCharacterDesign','client'],['randomizeCharacterDesign','client'],
 ['setTab','client'],['searchGE','absent']
];
export const SDK377_ACTION_COVERAGE=Object.freeze(
 Object.fromEntries(types.map(([name,mode])=>[name,Object.freeze({
  mode,sourceMapped:mode==='native'||mode==='guarded'||mode==='read',
  verifiedNativeEffect:false,verifiedAfterRelog:false
 })]))
);
export const SDK377_ACTION_TYPES=Object.freeze(types.map(([name])=>name));
if(SDK377_ACTION_TYPES.length!==39||
   new Set(SDK377_ACTION_TYPES).size!==39)
 throw new Error('Pinned upstream RS-SDK 39-action manifest incomplete');
