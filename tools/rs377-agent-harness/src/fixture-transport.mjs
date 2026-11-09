/** In-memory TEST-ONLY transport. Never connect this to family-world accounts. */
export function createFixtureTransport(){
  let tick=100;
  let state={
    world:{mode:'isolated',revision:377,tickMs:600,xpMultiplier:1,instanceId:'isolated-fixture-01'},
    tick,
    player:{username:'HarnessTest',isBot:true,x:3222,z:3218,plane:0,
      inventory:[{slot:0,id:1925,quantity:1}],xp:{Cooking:0,Woodcutting:0},
      questStages:{cooks_assistant:0},dialogue:null}
  };
  const clone=()=>structuredClone(state);
  return {
    observe:async()=>clone(),
    dispatch:async action=>{
      tick++;
      state.tick=tick;
      if(action.type==='walk'){state.player.x=action.x;state.player.z=action.z;}
      if(action.type==='npc_option'){state.player.dialogue={id:'fixture-only-'+action.npcIndex};}
      return {accepted:true};
    },
    // For guard tests only, never part of a live adapter.
    setWorldMode(mode){state.world.mode=mode;},
    setPlayerName(name){state.player.username=name;},
    setTick(n){state.tick=n;}
  };
}
