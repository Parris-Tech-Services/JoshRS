// JoshRS game engine: entirely original code and procedural artwork. No upstream game assets.
export const W = 38, H = 26, VIEW_W = 25, VIEW_H = 16, TILE = 32;
export const SKILLS = ["woodcutting","firemaking","mining","fishing","cooking","combat"];
export const OBJECTS = [
  ...[[12,9],[10,15],[22,7],[27,15],[13,21],[19,20],[23,19],[29,19],[9,6],[15,4],[20,5],[24,4],[32,16],[34,21],[11,23],[26,23],[30,12],[35,6]].map(([x,y],i)=>({id:"tree"+i,x,y,type:"tree",name:"Oak tree"})),
  ...[[28,8],[30,7],[32,6],[31,10],[34,13],[36,9],[33,4]].map(([x,y],i)=>({id:"rock"+i,x,y,type:"rock",name:"Copper rock"})),
  ...[[7,11],[7,16],[7,19]].map(([x,y],i)=>({id:"fish"+i,x,y,type:"fish",name:"Fishing spot"})),
  {id:"ranger",x:19,y:11,type:"npc",name:"Ranger Rowan"},
  {id:"banker",x:16,y:12,type:"npc",name:"Banker Fern"},
  {id:"merchant",x:20,y:12,type:"npc",name:"Merchant Mira"},
  {id:"moss1",x:25,y:17,type:"enemy",name:"Mossling"},
  {id:"moss2",x:33,y:18,type:"enemy",name:"Mossling"}
];
export const GOODS = ["logs","ore","fish","cooked"];
export const SELL_PRICES = Object.freeze({logs:3,ore:6,fish:5,cooked:9});
export const MEAL_PRICE = 12;
export const MAX_BAG_STACK = 9999, MAX_BANK_STACK = 999999, MAX_COINS = 9999999;
export const ORDER_COST = Object.freeze({logs:2,ore:1,cooked:1});
export const ORDER_REWARD = 75;
export const TASKS = [
 {key:"logs",need:3,title:"Chop 3 oak logs"},
 {key:"fires",need:1,title:"Light a campfire"},
 {key:"ore",need:2,title:"Mine 2 copper ore"},
 {key:"fish",need:2,title:"Catch 2 fish"},
 {key:"enemies",need:1,title:"Defeat a mossling"}
];
export function terrain(x,y) {
 if(x<0||y<0||x>=W||y>=H) return "void";
 if((x<=5 && y>=7 && y<=21)||(x<=7 && y>=9 && y<=19)) return "water";
 if(x>=27&&y<=10) return "stone";
 if(y===13&&x>=8&&x<=31 || x===18&&y>=5&&y<=23) return "path";
 return "grass";
}
export function objectAt(x,y){return OBJECTS.find(o=>o.x===x&&o.y===y) || null}
export function walkable(x,y) {return terrain(x,y)!=="void"&&terrain(x,y)!=="water"&&!objectAt(x,y)}
export function makeState() {
 return {version:1,x:18,y:13,hp:20,maxHp:20,coins:25,
   bag:{logs:0,ore:0,fish:0,cooked:0},bank:{logs:0,ore:0,fish:0,cooked:0},ordersFulfilled:0,xp:Object.fromEntries(SKILLS.map(k=>[k,0])),
   progress:{logs:0,fires:0,ore:0,fish:0,enemies:0},fires:[],defeated:[],questClaimed:false,run:false};
}
export function loadState(raw) {
 try {
  const s=JSON.parse(raw);if(!s||s.version!==1||!Number.isInteger(s.x)||!Number.isInteger(s.y)||!walkable(s.x,s.y))return makeState();
  const fresh=makeState();
  for(const k of GOODS) {
   fresh.bag[k]=Math.max(0,Math.min(9999,Math.floor(Number(s.bag?.[k])||0)));
   fresh.bank[k]=Math.max(0,Math.min(999999,Math.floor(Number(s.bank?.[k])||0)));
  }
  fresh.ordersFulfilled=Math.max(0,Math.min(99999,Math.floor(Number(s.ordersFulfilled)||0)));
  for(const k of SKILLS)fresh.xp[k]=Math.max(0,Math.min(99999999,Math.floor(Number(s.xp?.[k])||0)));
  for(const k of Object.keys(fresh.progress))fresh.progress[k]=Math.max(0,Math.min(99999,Math.floor(Number(s.progress?.[k])||0)));
  fresh.x=s.x;fresh.y=s.y;fresh.hp=Math.max(1,Math.min(20,Number(s.hp)||20));
  fresh.coins=Math.max(0,Math.min(9999999,Number(s.coins)||0));
  fresh.fires=Array.isArray(s.fires)?s.fires.filter(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&terrain(p.x,p.y)!=="void").slice(0,60):[];
  fresh.defeated=Array.isArray(s.defeated)?s.defeated.filter(id=>id==="moss1"||id==="moss2"):[];
  fresh.questClaimed=!!s.questClaimed;fresh.run=!!s.run;return fresh;
 } catch{return makeState()}
}
export function xpNeeded(level) {
 let total=0; for(let i=1;i<level;i++) total+=Math.floor(i+300*Math.pow(2,i/7));
 return Math.floor(total/4);
}
export function levelOf(xp){let lvl=1;while(lvl<99&&xp>=xpNeeded(lvl+1))lvl++;return lvl}
export function totalLevel(s){return SKILLS.reduce((a,k)=>a+levelOf(s.xp[k]),0)}
export function move(s,dx,dy) {
 if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1) return false;
 const x=s.x+dx,y=s.y+dy;
 if(!walkable(x,y))return false;
 s.x=x;s.y=y;return true;
}
export function nearestObject(s){
 return OBJECTS.filter(o=>!(o.type==="enemy"&&s.defeated.includes(o.id)))
   .map(o=>({o,d:Math.abs(o.x-s.x)+Math.abs(o.y-s.y)})).filter(v=>v.d<=1)
   .sort((a,b)=>a.d-b.d)[0]?.o||null;
}
export function pathTo(s,tx,ty,adjacent=false){
 const start=s.x+","+s.y,queue=[[s.x,s.y]],seen=new Set([start]),prev=new Map();
 const reached=(x,y)=>adjacent?Math.abs(x-tx)+Math.abs(y-ty)<=1:x===tx&&y===ty;
 if(reached(s.x,s.y))return [];
 let end=null;
 for(let i=0;i<queue.length&&i<W*H;i++){
  const [x,y]=queue[i];
  for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
   const nx=x+dx,ny=y+dy,key=nx+","+ny;
   if(seen.has(key)||!walkable(nx,ny))continue;
   seen.add(key);prev.set(key,[x,y]);queue.push([nx,ny]);
   if(reached(nx,ny)){end=[nx,ny];break}
  } if(end)break;
 }
 if(!end)return null;
 const path=[];let cur=end;
 while(cur[0]!==s.x||cur[1]!==s.y){path.push(cur);cur=prev.get(cur[0]+","+cur[1]);if(!cur)return null}
 return path.reverse();
}
export function completed(s){return TASKS.every(t=>s.progress[t.key]>=t.need)}
export function rewardIfReady(s){
 if(completed(s)&&!s.questClaimed){s.questClaimed=true;s.coins+=100;s.xp.woodcutting+=100;return " Quest complete! You earned 100 coins and 100 Woodcutting XP."}
 return "";
}
export function lightFire(s){
 if(s.bag.logs<1)return "Gather a log from an oak tree before lighting a fire.";
 if(s.fires.some(f=>f.x===s.x&&f.y===s.y))return "There is already a campfire here.";
 s.bag.logs--;s.progress.fires++;s.xp.firemaking+=40;
 s.fires.push({x:s.x,y:s.y});if(s.fires.length>60)s.fires.shift();
 return "You light a warm campfire. +40 Firemaking XP."+rewardIfReady(s);
}
export function eat(s){
 if(s.bag.cooked<1)return "You need cooked fish. Catch some and cook it at a campfire.";
 if(s.hp>=s.maxHp)return "You already have full health.";
 s.bag.cooked--;s.hp=Math.min(s.maxHp,s.hp+8);return "You eat a cooked fish and recover up to 8 HP.";
}
export function interact(s,o){
 if(!o)return "Move beside a tree, rock, fishing spot, ranger or mossling.";
 // Treat input as a target request, not as an authority to invent resource nodes.
 // Client-side validation is not server-side anti-cheat or authentication.
 if(!OBJECTS.some(real=>real.id===o.id&&real.type===o.type&&real.x===o.x&&real.y===o.y))return "Unknown world object.";
 if(Math.abs(s.x-o.x)+Math.abs(s.y-o.y)>1)return "Move closer to "+o.name+".";
 if(o.type==="tree"){if(s.bag.logs>=MAX_BAG_STACK)return "Your log stack is full.";s.bag.logs++;s.progress.logs++;s.xp.woodcutting+=25;return "You chop oak logs. +25 Woodcutting XP."+rewardIfReady(s)}
 if(o.type==="rock"){if(s.bag.ore>=MAX_BAG_STACK)return "Your ore stack is full.";s.bag.ore++;s.progress.ore++;s.xp.mining+=30;return "You mine copper ore. +30 Mining XP."+rewardIfReady(s)}
 if(o.type==="fish"){if(s.bag.fish>=MAX_BAG_STACK)return "Your fish stack is full.";s.bag.fish++;s.progress.fish++;s.xp.fishing+=20;return "You catch a river fish. +20 Fishing XP."+rewardIfReady(s)}
 if(o.type==="npc"){
  if(o.id==="banker")return "Banker Fern: Your supplies are safe here. Open the Town tab to deposit or withdraw items.";
  if(o.id==="merchant")return "Merchant Mira: I buy gathered supplies and sell cooked fish. Open the Town tab to trade.";
  return s.questClaimed?"Ranger Rowan: Well done! Complete a woodland supply order at the Town tab for more rewards.":"Ranger Rowan: Welcome! Try gathering wood, lighting a fire, mining, fishing and defeating a mossling.";
 }
 if(o.type==="enemy"){
  if(s.defeated.includes(o.id))return "The mossling has already been defeated.";
  s.defeated.push(o.id);s.progress.enemies++;s.xp.combat+=50;s.coins+=15;s.hp=Math.max(1,s.hp-4);
  return "You defeat the mossling! +50 Combat XP, 15 coins. You lose 4 HP."+rewardIfReady(s);
 }
 return "Nothing happens.";
}
export function cook(s){
 if(!s.fires.some(f=>Math.abs(f.x-s.x)+Math.abs(f.y-s.y)<=1))return "Stand by a lit campfire to cook.";
 if(s.bag.fish<1)return "You need to catch a fish first.";
 if(s.bag.cooked>=MAX_BAG_STACK)return "Your cooked-fish stack is full.";
 s.bag.fish--;s.bag.cooked++;s.xp.cooking+=30;return "You cook a delicious fish. +30 Cooking XP.";
}

/** All town services require physical proximity, including keyboard and touch access. */
export function nearNpc(s,id){
 const npc=OBJECTS.find(o=>o.id===id&&o.type==="npc");
 return !!npc && Math.abs(s.x-npc.x)+Math.abs(s.y-npc.y)<=1;
}
export function depositAll(s){
 if(!nearNpc(s,"banker"))return "Stand beside Banker Fern to store your supplies.";
 let count=0;
 for(const k of GOODS){
  const n=Math.max(0,Math.min(s.bag[k]||0,MAX_BANK_STACK-(s.bank[k]||0)));
  s.bank[k]+=n;s.bag[k]-=n;count+=n;
 }
 return count?"Banker Fern stores "+count+" supplies safely.":"Your bag is already empty.";
}
export function withdrawAll(s){
 if(!nearNpc(s,"banker"))return "Stand beside Banker Fern to withdraw your supplies.";
 let count=0;
 for(const k of GOODS){
  const amount=Math.min(Math.max(0,MAX_BAG_STACK-s.bag[k]),s.bank[k]);
  s.bank[k]-=amount;s.bag[k]+=amount;count+=amount;
 }
 return count?"You withdraw "+count+" supplies from your bank.":"Nothing to withdraw, or your bag is full.";
}
export function sellOne(s,key){
 if(!nearNpc(s,"merchant"))return "Stand beside Merchant Mira to trade.";
 if(!Object.hasOwn(SELL_PRICES,key))return "This item cannot be sold.";
 if(s.bag[key]<1)return "You have no "+key+" to sell.";
 if(s.coins>MAX_COINS-SELL_PRICES[key])return "Your coin pouch is full; spend coins before selling.";
 s.bag[key]--;s.coins+=SELL_PRICES[key];
 return "Sold one "+key+" for "+SELL_PRICES[key]+" coins.";
}
export function buyMeal(s){
 if(!nearNpc(s,"merchant"))return "Stand beside Merchant Mira to trade.";
 if(s.coins<MEAL_PRICE)return "You need "+MEAL_PRICE+" coins to buy a cooked fish.";
 if(s.bag.cooked>=MAX_BAG_STACK)return "Your cooked-fish stack is full.";
 s.coins-=MEAL_PRICE;s.bag.cooked++;
 return "You buy a cooked fish for "+MEAL_PRICE+" coins.";
}
export function fulfilOrder(s){
 if(!nearNpc(s,"merchant"))return "Stand beside Merchant Mira to deliver supplies.";
 if(!s.questClaimed)return "Finish Ranger Rowan's Forest Apprentice quest before taking delivery orders.";
 if(GOODS.some(k=>(ORDER_COST[k]||0)>s.bag[k]))return "Supply order: bring 2 logs, 1 ore and 1 cooked fish.";
 if(s.ordersFulfilled>=99999||s.coins>MAX_COINS-ORDER_REWARD)return "Your orders or coin pouch have reached their save limit.";
 for(const [k,n] of Object.entries(ORDER_COST))s.bag[k]-=n;
 s.ordersFulfilled++;s.coins+=ORDER_REWARD;
 s.xp.woodcutting+=25;s.xp.mining+=25;s.xp.cooking+=25;
 return "Supply order complete! +"+ORDER_REWARD+" coins and +25 XP in three skills. Orders: "+s.ordersFulfilled+".";
}
export function isValidSavedState(raw){
 try {
  if(typeof raw!=="string"||raw.length>1048576)return false;
  const s=JSON.parse(raw);
  return !!s&&typeof s==="object"&&!Array.isArray(s)&&s.version===1&&
   Number.isInteger(s.x)&&Number.isInteger(s.y)&&walkable(s.x,s.y)&&
   s.bag&&typeof s.bag==="object"&&s.xp&&typeof s.xp==="object"&&
   s.progress&&typeof s.progress==="object";
 }catch{return false}
}
