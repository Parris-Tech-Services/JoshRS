import test from "node:test";
import assert from "node:assert/strict";
import {W,H,TASKS,terrain,objectAt,walkable,makeState,loadState,move,pathTo,xpNeeded,levelOf,totalLevel,lightFire,eat,interact,cook,completed} from "../core.mjs";
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
