import test from "node:test";
import assert from "node:assert/strict";
import {W,H,TASKS,terrain,objectAt,walkable,makeState,loadState,move,pathTo,xpNeeded,levelOf,totalLevel,lightFire,eat,interact,cook,completed,nearNpc,depositAll,withdrawAll,sellOne,buyMeal,fulfilOrder,isValidSavedState} from "../core.mjs";
test("fresh player is in bounds and has starter inventory",()=>{
 const s=makeState();assert.equal(walkable(s.x,s.y),true);assert.equal(s.bag.logs,0);assert.equal(s.hp,20);assert.equal(totalLevel(s),6);
});
test("map rejects water and out-of-bounds, paths reach lake",()=>{
 assert.equal(terrain(-1,2),"void");assert.equal(walkable(3,12),false);
 const s=makeState();let path=pathTo(s,7,11,true);assert.ok(path?.length>0);assert.ok(path.every(([x,y])=>walkable(x,y)));
});
test("movement only accepts orthogonal steps and traversable tiles",()=>{
 const s=makeState();assert.equal(move(s,2,0),false);assert.equal(move(s,1,1),false);
 assert.equal(move(s,0,1),true);assert.equal(s.y,14);
});
test("skills gain XP, resources accumulate and fire uses logs",()=>{
 const s=makeState();s.x=11;s.y=9;assert.match(interact(s,objectAt(12,9)),/Woodcutting/);
 assert.equal(s.bag.logs,1);assert.equal(s.xp.woodcutting,25);
 assert.match(lightFire(s),/Firemaking/);assert.equal(s.bag.logs,0);assert.equal(s.progress.fires,1);
 assert.match(lightFire(s),/Gather a log/);
});
test("fishing, cooking and eating restore health",()=>{
 const s=makeState();s.x=8;s.y=11;
 assert.match(interact(s,objectAt(7,11)),/catch/);assert.equal(s.bag.fish,1);
 s.fires=[{x:8,y:12}];assert.match(cook(s),/cook/);assert.equal(s.bag.cooked,1);
 s.hp=10;assert.match(eat(s),/recover/);assert.equal(s.hp,18);
});
test("combat gives rewards once and does not reduce HP below 1",()=>{
 const s=makeState();s.x=24;s.y=16;s.hp=2;
 assert.match(interact(s,objectAt(25,17)),/Move closer/);
 s.x=24;s.y=17;assert.match(interact(s,objectAt(25,17)),/defeat/);
 assert.equal(s.hp,1);assert.equal(s.coins,40);assert.equal(s.progress.enemies,1);
 assert.match(interact(s,objectAt(25,17)),/already/);assert.equal(s.coins,40);
});
test("quest completes exactly once",()=>{
 const s=makeState();s.progress={logs:3,fires:1,ore:2,fish:2,enemies:0};s.x=24;s.y=17;
 assert.equal(completed(s),false);const msg=interact(s,objectAt(25,17));assert.match(msg,/Quest complete/);
 assert.equal(s.questClaimed,true);assert.equal(s.coins,140);
 assert.equal(completed(s),true);
});
test("XP thresholds and level cap work",()=>{
 assert.equal(xpNeeded(1),0);assert.equal(levelOf(0),1);assert.equal(levelOf(xpNeeded(2)),2);assert.equal(levelOf(100000000),99);
});
test("save round trip and corrupt save recovery",()=>{
 const s=makeState();s.bag.logs=4;s.progress.logs=4;const restored=loadState(JSON.stringify(s));
 assert.equal(restored.bag.logs,4);assert.deepEqual(loadState("invalid"),makeState());
 const invalid={...s,x:999};assert.deepEqual(loadState(JSON.stringify(invalid)),makeState());
});

test("bank deposits and withdrawals preserve items without minting resources",()=>{
 const s=makeState();s.bag.logs=7;s.bag.ore=2;
 assert.match(depositAll(s),/Stand beside/);
 assert.equal(s.bank.logs,0);
 s.x=17;s.y=12;
 assert.equal(nearNpc(s,"banker"),true);
 assert.match(depositAll(s),/stores 9/);
 assert.equal(s.bag.logs,0);assert.equal(s.bank.logs,7);
 assert.match(withdrawAll(s),/withdraw 9/);
 assert.equal(s.bank.logs,0);assert.equal(s.bag.logs,7);
 assert.equal(s.bag.ore,2);
});
test("trading requires the merchant and cannot create free coins or food",()=>{
 const s=makeState();s.bag.logs=1;
 assert.match(sellOne(s,"logs"),/Stand beside/);
 s.x=19;s.y=12;
 assert.equal(nearNpc(s,"merchant"),true);
 assert.match(sellOne(s,"fish"),/no fish/);
 assert.match(sellOne(s,"invalid"),/cannot be sold/);
 assert.match(sellOne(s,"logs"),/3 coins/);
 assert.equal(s.coins,28);assert.equal(s.bag.logs,0);
 assert.match(buyMeal(s),/12 coins/);
 assert.equal(s.coins,16);assert.equal(s.bag.cooked,1);
 s.coins=0;assert.match(buyMeal(s),/need 12 coins/);
});
test("repeatable supplies require the tutorial and consume items each time",()=>{
 const s=makeState();s.x=19;s.y=12;
 s.bag={logs:2,ore:1,fish:0,cooked:1};
 assert.match(fulfilOrder(s),/Finish Ranger/);
 s.questClaimed=true;
 assert.match(fulfilOrder(s),/Supply order complete/);
 assert.equal(s.ordersFulfilled,1);assert.equal(s.coins,100);
 assert.deepEqual(s.bag,{logs:0,ore:0,fish:0,cooked:0});
 assert.match(fulfilOrder(s),/bring 2 logs/);
 assert.equal(s.coins,100);assert.equal(s.ordersFulfilled,1);
});
test("bank, orders and portable saves survive an engine load round-trip",()=>{
 const s=makeState();s.bank.logs=15;s.bank.fish=22;s.ordersFulfilled=4;
 const raw=JSON.stringify(s);assert.equal(isValidSavedState(raw),true);
 const restored=loadState(raw);assert.equal(restored.bank.logs,15);
 assert.equal(restored.bank.fish,22);assert.equal(restored.ordersFulfilled,4);
 assert.equal(isValidSavedState("invalid"),false);
 assert.equal(isValidSavedState(JSON.stringify({...s,x:400})),false);
 assert.equal(isValidSavedState(JSON.stringify({...s,version:22})),false);
 assert.equal(isValidSavedState("a".repeat(1048577)),false);
 const legacy=makeState();delete legacy.bank;delete legacy.ordersFulfilled;
 const migrated=loadState(JSON.stringify(legacy));
 assert.equal(migrated.bank.logs,0);assert.equal(migrated.ordersFulfilled,0);
});
