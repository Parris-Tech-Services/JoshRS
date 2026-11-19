const token=document.querySelector('meta[name=csrf]').content;
const list=document.getElementById('list'),msg=document.getElementById('message');
async function request(path,data){
 const result=await fetch('/api/'+path,{method:'POST',headers:{
  'content-type':'application/json','x-joshrs-csrf':token},
  body:JSON.stringify(data)});
 const obj=await result.json();
 if(!result.ok)throw new Error(obj.error||'Operation rejected');
 return obj;
}
function el(tag,text,cls){
 const n=document.createElement(tag);n.textContent=text;
 if(cls)n.className=cls;
 return n;
}
async function refresh(){
 try{
  const r=await fetch('/api/status',{cache:'no-store'});
  if(!r.ok)throw Error('Status unavailable');
  const data=await r.json();
  list.replaceChildren();
  if(!data.agents.length){list.append(el('p','No disposable agents created yet.','muted'));return}
  for(const agent of data.agents){
   const row=el('article','');
   row.append(el('strong',agent.name),
    el('span',agent.phase+' · '+agent.goal+' · verified steps: '+agent.verifiedSteps+' · verified activities: '+(agent.verifiedActivities||0)));
   if(agent.error)row.append(el('p',agent.error,'error'));
   if(agent.lastVerified)row.append(el('p','Last verified move '+agent.lastVerified.x+', '+agent.lastVerified.z+' at game tick '+agent.lastVerified.tick,'muted'));
   const controls=el('div','');controls.className='controls';
   const ops=[];
   if(agent.phase==='stopped'||agent.phase==='error')ops.push(['Start','start']);
   if(agent.phase==='running')ops.push(['Pause','pause']);
   if(agent.phase==='paused')ops.push(['Resume','resume']);
   if(agent.phase!=='stopped')ops.push(['Stop','stop']);
   for(const [label,op] of ops){
    const btn=el('button',label);btn.type='button';
    btn.onclick=async()=>{
     try{
      btn.disabled=true;
      const args={name:agent.name};
      if(op==='start'){
       const password=prompt('Disposable '+agent.name+' game password (not saved):');
       if(password===null){btn.disabled=false;return}
       args.password=password;
      }
      await request(op,args);
      msg.textContent=label+' request accepted for '+agent.name;
     }catch(e){msg.textContent=String(e.message)}
     finally{await refresh()}
    };
    controls.append(btn);
   }
   const select=el('select','');
   for(const goal of ['idle','explore','woodcut','talk']){
    const option=el('option',goal);option.value=goal;
    option.selected=goal===agent.goal;select.append(option);
   }
   select.onchange=async()=>{
    try{await request('goal',{name:agent.name,goal:select.value});msg.textContent='Goal updated'}
    catch(e){msg.textContent=e.message}
    finally{await refresh()}
   };
   controls.append(select);row.append(controls);list.append(row);
  }
 }catch(e){msg.textContent=e.message}
}
document.getElementById('create').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=e.currentTarget,data=Object.fromEntries(new FormData(form));
 try{await request('create',data);form.reset();msg.textContent='Profile created'}
 catch(error){msg.textContent=error.message}
 finally{await refresh()}
});
refresh();
setInterval(refresh,3000);
