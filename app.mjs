import {W,H,VIEW_W,VIEW_H,TILE,SKILLS,OBJECTS,TASKS,terrain,objectAt,walkable,makeState,loadState,xpNeeded,levelOf,totalLevel,move,nearestObject,pathTo,completed,lightFire,eat,interact,cook,GOODS,SELL_PRICES,MEAL_PRICE,ORDER_REWARD,nearNpc,depositAll,withdrawAll,sellOne,buyMeal,fulfilOrder,isValidSavedState} from "./core.mjs";
const $=id=>document.getElementById(id);
const canvas=$("world"),ctx=canvas.getContext("2d");
const STORAGE_KEY="joshrs-woodlands-v1";
let state,selected=null,steps=[],pending=null,walkingTimer=null;
try{state=loadState(localStorage.getItem(STORAGE_KEY))}catch{state=makeState()}
const names={logs:"Oak logs",ore:"Copper ore",fish:"River fish",cooked:"Cooked fish"};
const icons={logs:"L",ore:"O",fish:"F",cooked:"C"};
const skillNames={woodcutting:"Woodcutting",firemaking:"Firemaking",mining:"Mining",fishing:"Fishing",cooking:"Cooking",combat:"Combat"};
function save(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$("save-state").textContent="Saved locally"}catch{$("save-state").textContent="Saving unavailable"}
}
function notify(text){$("message").textContent=text;$("status-label").textContent=text.length>36?"Adventuring":text}
function camera(){return {x:Math.max(0,Math.min(W-VIEW_W,state.x-Math.floor(VIEW_W/2))),y:Math.max(0,Math.min(H-VIEW_H,state.y-Math.floor(VIEW_H/2)))}}
function hash(x,y){let n=Math.imul(x+17,374761393)+Math.imul(y+37,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function rounded(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function tileDraw(type,x,y,wx,wy){
 const c=type==="water"?"#216579":type==="path"?"#b49a70":type==="stone"?"#777e72":"#53785b";
 ctx.fillStyle=c;ctx.fillRect(x,y,TILE,TILE);
 const n=hash(wx,wy);ctx.fillStyle=type==="grass"?"#638767":type==="water"?"#3b8494":type==="stone"?"#899087":"#cab08a";
 if(type==="grass"){
  ctx.fillRect(x+5+(n*17|0),y+6+(n*12|0),2,5);
  ctx.fillRect(x+19,y+22,3,2);
  if(n>.85){ctx.fillStyle="#dabf71";ctx.fillRect(x+12,y+15,3,3)}
 }else if(type==="water"){
  ctx.globalAlpha=.5;ctx.fillRect(x+(n*9|0)+4,y+11,18,2);ctx.fillRect(x+13,y+24,11,2);ctx.globalAlpha=1;
 }else{
  ctx.globalAlpha=.25;ctx.fillRect(x+4,y+4,5,2);ctx.fillRect(x+20,y+23,7,2);ctx.globalAlpha=1;
 }
 ctx.strokeStyle="rgba(10,29,23,.08)";ctx.strokeRect(x+.5,y+.5,TILE-1,TILE-1);
}
function drawTree(x,y){
 ctx.fillStyle="rgba(13,29,22,.28)";ctx.beginPath();ctx.ellipse(x+16,y+26,13,5,0,0,Math.PI*2);ctx.fill();
 rounded(x+13,y+15,7,16,2,"#76502f");
 for(const [dx,dy,r,c] of [[10,14,9,"#285d40"],[22,13,10,"#306b44"],[16,7,11,"#36804c"],[11,9,7,"#438b52"]]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,Math.PI*2);ctx.fill()}
 ctx.fillStyle="#6ba167";ctx.fillRect(x+13,y+3,4,3);
}
function drawRock(x,y){
 ctx.fillStyle="#414f4e";ctx.beginPath();ctx.moveTo(x+4,y+25);ctx.lineTo(x+8,y+11);ctx.lineTo(x+20,y+5);ctx.lineTo(x+29,y+17);ctx.lineTo(x+26,y+28);ctx.closePath();ctx.fill();
 ctx.fillStyle="#a3aba7";ctx.beginPath();ctx.moveTo(x+8,y+12);ctx.lineTo(x+20,y+5);ctx.lineTo(x+23,y+17);ctx.lineTo(x+13,y+20);ctx.closePath();ctx.fill();
 ctx.fillStyle="#d4a46f";ctx.fillRect(x+17,y+15,4,4);
}
function drawFish(x,y){ctx.strokeStyle="#d6e7d9";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+15,y+15,7,0,Math.PI*1.5);ctx.stroke();ctx.fillStyle="#d9e7d6";ctx.beginPath();ctx.moveTo(x+21,y+14);ctx.lineTo(x+27,y+11);ctx.lineTo(x+27,y+18);ctx.closePath();ctx.fill();ctx.lineWidth=1}
function drawFigure(x,y,shade,hat=false){
 ctx.fillStyle="rgba(15,33,27,.25)";ctx.beginPath();ctx.ellipse(x+16,y+28,9,3,0,0,7);ctx.fill();
 rounded(x+10,y+18,5,10,1,"#263e3a");rounded(x+17,y+18,5,10,1,"#263e3a");
 rounded(x+8,y+12,16,12,4,shade);
 ctx.fillStyle="#e8c39e";ctx.beginPath();ctx.arc(x+16,y+9,6,0,7);ctx.fill();
 ctx.fillStyle="#493827";ctx.fillRect(x+12,y+5,9,2);if(hat){rounded(x+7,y+3,18,4,2,"#7d623e");rounded(x+11,y-1,10,6,2,"#927449")}
 ctx.fillStyle="#28312b";ctx.fillRect(x+13,y+9,2,2);ctx.fillRect(x+19,y+9,2,2);
}
function drawEnemy(x,y){
 ctx.fillStyle="rgba(21,41,22,.3)";ctx.beginPath();ctx.ellipse(x+16,y+27,12,4,0,0,7);ctx.fill();
 ctx.fillStyle="#80aa5c";ctx.beginPath();ctx.ellipse(x+16,y+19,12,10,0,0,7);ctx.fill();
 ctx.fillStyle="#cce49b";ctx.fillRect(x+9,y+16,4,4);ctx.fillRect(x+19,y+16,4,4);
 ctx.fillStyle="#263c32";ctx.fillRect(x+11,y+17,2,3);ctx.fillRect(x+21,y+17,2,3);
}
function drawFire(x,y){
 ctx.fillStyle="#5d432a";ctx.save();ctx.translate(x+16,y+25);ctx.rotate(.35);ctx.fillRect(-11,-2,22,5);ctx.rotate(-.7);ctx.fillRect(-11,-2,22,5);ctx.restore();
 ctx.fillStyle="#f3b448";ctx.beginPath();ctx.moveTo(x+16,y+7);ctx.quadraticCurveTo(x+27,y+20,x+20,y+24);ctx.lineTo(x+11,y+24);ctx.quadraticCurveTo(x+7,y+19,x+16,y+7);ctx.fill();
 ctx.fillStyle="#f9df78";ctx.beginPath();ctx.moveTo(x+16,y+14);ctx.quadraticCurveTo(x+22,y+23,x+16,y+24);ctx.quadraticCurveTo(x+12,y+22,x+16,y+14);ctx.fill();
}
function draw(){
 const cam=camera();ctx.clearRect(0,0,canvas.width,canvas.height);
 for(let y=0;y<VIEW_H;y++)for(let x=0;x<VIEW_W;x++)tileDraw(terrain(x+cam.x,y+cam.y),x*TILE,y*TILE,x+cam.x,y+cam.y);
 for(const fire of state.fires) {const x=(fire.x-cam.x)*TILE,y=(fire.y-cam.y)*TILE;if(x>=0&&x<canvas.width&&y>=0&&y<canvas.height)drawFire(x,y)}
 for(const o of OBJECTS){
  if(o.type==="enemy"&&state.defeated.includes(o.id))continue;
  const x=(o.x-cam.x)*TILE,y=(o.y-cam.y)*TILE;if(x<0||y<0||x>=canvas.width||y>=canvas.height)continue;
  if(selected===o.id){ctx.fillStyle="rgba(241,210,116,.28)";ctx.fillRect(x,y,32,32);ctx.strokeStyle="#f9d687";ctx.lineWidth=2;ctx.strokeRect(x+2,y+2,28,28);ctx.lineWidth=1}
  if(o.type==="tree")drawTree(x,y);else if(o.type==="rock")drawRock(x,y);else if(o.type==="fish")drawFish(x,y);else if(o.type==="npc"){drawFigure(x,y,o.id==="banker"?"#688e9c":o.id==="merchant"?"#a77d59":"#b49a66",true);if(o.id!=="ranger"){ctx.fillStyle="#fff1c7";ctx.font="bold 11px system-ui";ctx.fillText(o.id==="banker"?"B":"M",x+12,y+5)}}else drawEnemy(x,y);
 }
 drawFigure((state.x-cam.x)*TILE,(state.y-cam.y)*TILE,"#456faf");
 ctx.strokeStyle="rgba(250,235,180,.8)";ctx.lineWidth=2;ctx.strokeRect((state.x-cam.x)*TILE+2,(state.y-cam.y)*TILE+2,28,28);ctx.lineWidth=1;
}
function updateUI(){
 $("coords").textContent=state.x+", "+state.y;$("hp").textContent=state.hp+"/"+state.maxHp+" HP";$("gold").textContent=state.coins.toLocaleString();$("total-level").textContent=totalLevel(state);$("run-btn").textContent=state.run?"Run mode":"Walk mode";$("run-btn").setAttribute("aria-pressed",String(state.run));
 $("quest-list").innerHTML=TASKS.map(t=>{const value=Math.min(t.need,state.progress[t.key]);return '<div class="task '+(value===t.need?"done":"")+'"><span class="task-icon">'+(value===t.need?"✓":"")+'</span><span>'+t.title+'</span><b>'+value+'/'+t.need+'</b></div>'}).join("");
 $("quest-reward").textContent=state.questClaimed?"Quest complete! 100 coins + 100 bonus XP awarded.":"Reward: 100 coins + 100 Woodcutting XP";
 $("inventory").innerHTML=Object.keys(names).map(k=>'<div class="item"><div class="item-icon '+k+'">'+icons[k]+'</div><strong>'+names[k]+'</strong><span>'+state.bag[k]+'</span></div>').join("")+'<div class="tools-text">Equipped: Axe · Pickaxe · Fishing net · Tinderbox · Sword</div>';
 $("skills-list").innerHTML=SKILLS.map(k=>{const lvl=levelOf(state.xp[k]),start=xpNeeded(lvl),end=xpNeeded(Math.min(99,lvl+1)),pct=lvl===99?100:Math.max(0,Math.min(100,100*(state.xp[k]-start)/(end-start)));return '<div class="skill"><div><span>'+skillNames[k]+'</span><strong>Lv '+lvl+'</strong></div><div class="progress"><span style="width:'+pct+'%"></span></div><small>'+state.xp[k].toLocaleString()+' XP</small></div>'}).join("");
 $("town-location").textContent=nearNpc(state,"banker")?"At Banker Fern":nearNpc(state,"merchant")?"At Merchant Mira":"Visit Fern or Mira in Oakvale to use town services.";
 $("bank-summary").textContent=GOODS.map(k=>names[k]+": "+state.bank[k]).join(" · ");
 $("order-progress").textContent=state.questClaimed?"Delivered: "+state.ordersFulfilled+" · Next order: 2 logs, 1 ore, 1 cooked fish · Reward: "+ORDER_REWARD+" coins.":"Finish Forest Apprentice to unlock repeatable delivery orders.";
 for(const btn of document.querySelectorAll("[data-town-service]")){
  const type=btn.dataset.townService;
  btn.disabled=type==="bank"? !nearNpc(state,"banker"):!nearNpc(state,"merchant") || (type==="order"&&!state.questClaimed);
 }
 draw();
}
function commit(message){save();updateUI();if(message)notify(message)}
function doInteract(target){
 const msg=interact(state,target);commit(msg);
 if(target?.id==="banker"||target?.id==="merchant")document.querySelector('[data-tab="town"]').click();
}
function doCook(){commit(cook(state))}
function doLight(){commit(lightFire(state))}
function stopWalk(){steps=[];pending=null}
function finishWalk(){
 if(!steps.length){if(pending){const action=pending;pending=null;if(action.type==="cook")doCook();else doInteract(action.object)}return}
 const next=steps.shift();if(!move(state,next[0]-state.x,next[1]-state.y)){stopWalk();notify("The path is blocked.");return}commit();if(!steps.length)finishWalk();
}
function walkPath(path,action=null){
 if(path===null){notify("I can't reach that spot.");return}
 steps=path.slice();pending=action;if(!steps.length)finishWalk();else notify("Walking to destination…");
}
function handleTile(tx,ty){
 if(tx<0||ty<0||tx>=W||ty>=H)return;
 const o=objectAt(tx,ty);
 if(o){if(o.type==="enemy"&&state.defeated.includes(o.id)){notify("That mossling has already been defeated.");return}selected=o.id;walkPath(pathTo(state,tx,ty,true),{type:"object",object:o})}
 else if(state.fires.some(f=>f.x===tx&&f.y===ty)){selected=null;walkPath(pathTo(state,tx,ty,true),{type:"cook"})}
 else{selected=null;walkPath(pathTo(state,tx,ty,false))}
 draw();
}
canvas.addEventListener("click",e=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const cam=camera(),tx=cam.x+Math.floor((e.clientX-r.left)*canvas.width/r.width/TILE),ty=cam.y+Math.floor((e.clientY-r.top)*canvas.height/r.height/TILE);handleTile(tx,ty);canvas.focus({preventScroll:true})});
function manualMove(dx,dy){stopWalk();selected=null;if(move(state,dx,dy))commit();else notify("You can't walk there.");}
document.querySelectorAll("[data-step]").forEach(btn=>{const [dx,dy]=btn.dataset.step.split(",").map(Number);let hold=null;btn.addEventListener("pointerdown",e=>{e.preventDefault();manualMove(dx,dy);hold=setInterval(()=>manualMove(dx,dy),state.run?110:170)});for(const type of ["pointerup","pointercancel","pointerleave"])btn.addEventListener(type,()=>{if(hold){clearInterval(hold);hold=null}});});
document.addEventListener("keydown",e=>{
 const tag=document.activeElement?.tagName;if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT")return;
 const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
 if(dirs[e.key]){e.preventDefault();manualMove(...dirs[e.key])}
 else if(e.key.toLowerCase()==="e"){e.preventDefault();const o=nearestObject(state);if(state.bag.fish>0&&state.fires.some(f=>Math.abs(f.x-state.x)+Math.abs(f.y-state.y)<=1))doCook();else doInteract(o)}
 else if(e.key.toLowerCase()==="f"){e.preventDefault();doLight()}
 else if(e.key.toLowerCase()==="h"){e.preventDefault();commit(eat(state))}
});
$("interact-btn").addEventListener("click",()=>{if(state.bag.fish>0&&state.fires.some(f=>Math.abs(f.x-state.x)+Math.abs(f.y-state.y)<=1))doCook();else doInteract(nearestObject(state))});
$("light-btn").addEventListener("click",doLight);
$("eat-btn").addEventListener("click",()=>commit(eat(state)));
$("run-btn").addEventListener("click",()=>{state.run=!state.run;commit(state.run?"Run mode enabled.":"Walk mode enabled.")});
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{for(const b of document.querySelectorAll("[data-tab]")){const active=b===btn;b.setAttribute("aria-selected",String(active));$("panel-"+b.dataset.tab).hidden=!active}}));
$("help-btn").addEventListener("click",()=>$("help-dialog").showModal());
$("reset-btn").addEventListener("click",()=>{if(!window.confirm("Start a new adventure? All locally saved progress will be erased."))return;stopWalk();state=makeState();selected=null;commit("A new adventure begins in Oakvale.")});
// All trading, storage and orders are validated by the engine (not only button state).
$("deposit-btn").addEventListener("click",()=>commit(depositAll(state)));
$("withdraw-btn").addEventListener("click",()=>commit(withdrawAll(state)));
document.querySelectorAll("[data-sell]").forEach(btn=>btn.addEventListener("click",()=>commit(sellOne(state,btn.dataset.sell))));
$("buy-meal-btn").addEventListener("click",()=>commit(buyMeal(state)));
$("order-btn").addEventListener("click",()=>commit(fulfilOrder(state)));
// Portable, explicit offline save transfers. No server or third-party credentials.
$("export-save-btn").addEventListener("click",()=>{
 const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");
 a.href=url;a.download="joshrs-woodlands-save.json";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 notify("Save downloaded. Keep the file somewhere safe; this device still saves automatically.");
});
$("import-save-btn").addEventListener("click",()=>$("import-save-file").click());
$("import-save-file").addEventListener("change",async e=>{
 const file=e.currentTarget.files?.[0];e.currentTarget.value="";
 if(!file)return;
 if(file.size>1048576){notify("That save file is too large (maximum 1 MB).");return}
 try{
  const raw=await file.text();
  if(!isValidSavedState(raw)){notify("Invalid save file. Your current game has not been changed.");return}
  if(!window.confirm("Replace your current Woodlands progress with this save file?"))return;
  stopWalk();selected=null;state=loadState(raw);commit("Imported your saved adventure successfully.");
 }catch{notify("Unable to read this save file. Your current game has not been changed.")}
});
walkingTimer=setInterval(()=>{if(steps.length)finishWalk()},170);
window.addEventListener("pagehide",save);
commit("Welcome to Oakvale. Tap a tree, rock or fishing spot to begin.");
