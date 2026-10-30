// Original standalone gameplay rules, not a 377 server plugin.
export const REQUIRED=Object.freeze(['specimen_clay','specimen_shell','specimen_stone']);
export function newState(){return {found:[],complete:false,coins:0,questPoints:0};}
export function collect(state,id){
  if(!REQUIRED.includes(id))return {ok:false,reason:'Unknown specimen',state};
  if(state.complete)return {ok:false,reason:'Quest already completed',state};
  if(state.found.includes(id))return {ok:false,reason:'Already collected',state};
  return {ok:true,state:{...state,found:[...state.found,id]}};
}
export function deliver(state){
  if(state.complete)return {ok:false,reason:'Already rewarded',state};
  if(!REQUIRED.every(id=>state.found.includes(id)))return {ok:false,reason:'Missing specimens',state};
  return {ok:true,state:{...state,complete:true,coins:state.coins+125,questPoints:state.questPoints+1}};
}
export const dialogue=Object.freeze({
 guide:['Welcome to Tideglass Isle. Our dig camp is small, but every find tells a story.','Take care near the cliffs. The ferry will bring you safely home.'],
 ferryman:['I can take you back to the mainland once the route is open.'],
 collector:['Could you bring me three different kinds of specimen?','Clay, shell and stone will help us understand this place.'],
 merchant:['We trade supplies here. The store will open once its inventory is configured.']
});
