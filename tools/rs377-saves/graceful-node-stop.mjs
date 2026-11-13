// Windows background-console fallback: invoke the engine's existing SIGINT event
// handler through a temporary local debugger connection. Never process.kill().
// Refuses a pre-existing debugger; validates PID, exact cwd, profile and handler.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const canonical=p=>fs.realpathSync(p).replaceAll('\\','/').toLowerCase();
async function openPort(port) {
    return new Promise(resolve=>{const s=net.connect({host:'127.0.0.1',port});s.setTimeout(500);s.on('connect',()=>{s.destroy();resolve(true);});s.on('timeout',()=>{s.destroy();resolve(false);});s.on('error',()=>resolve(false));});
}
export async function gracefulNodeStop(engine) {
    const root=fs.realpathSync(engine);
    const source=fs.readFileSync(path.join(root,'src/app.ts'),'utf8');
    if(!source.includes("process.on('SIGINT', safeExit)") || !source.includes('World.rebootTimer(0)')) throw new Error('Expected graceful engine shutdown handler is missing.');
    const env=fs.readFileSync(path.join(root,'.env'),'utf8');
    const profiles=[...env.matchAll(/^\s*NODE_PROFILE\s*=\s*([^\r\n]*)/gm)];
    if(profiles.length>1) throw new Error('Multiple selected profiles.');
    const profile=profiles.length ? profiles[0][1].trim().replace(/^["']|["']$/g,'') : 'main';
    if(!/^[a-z0-9_-]+$/i.test(profile)) throw new Error('Invalid selected profile.');
    const pid=Number(fs.readFileSync(path.join(root,'data',`.josh-rs-377-${profile}.pid`),'utf8').trim());
    if(!Number.isSafeInteger(pid)||pid<=0) throw new Error('Invalid selected engine PID.');
    if(await openPort(9229)) throw new Error('A debugger is already active; it will not be touched.');
    process._debugProcess(pid);
    let targets;
    for(let attempt=0;attempt<30;attempt++) {
        try {targets=await (await fetch('http://127.0.0.1:9229/json/list',{signal:AbortSignal.timeout(1000)})).json();break;}
        catch {await sleep(200);}
    }
    if(!Array.isArray(targets)||targets.length!==1) throw new Error('Could not identify a unique local debugger target.');
    const address=new URL(targets[0].webSocketDebuggerUrl);
    if(address.hostname!=='127.0.0.1'||address.port!=='9229') throw new Error('Debugger is not loopback-only.');
    const socket=new WebSocket(address);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    let seq=0;
    async function evaluate(expression) {
        const id=++seq;
        return new Promise((resolve,reject)=>{
            const timer=setTimeout(()=>{socket.removeEventListener('message',listener);reject(new Error('Debugger response timed out.'));},5000);
            function listener(event) {const r=JSON.parse(event.data);if(r.id!==id)return;clearTimeout(timer);socket.removeEventListener('message',listener);if(r.error||r.result?.exceptionDetails)reject(new Error('Debugger evaluation failed.'));else resolve(r.result.result.value);}
            socket.addEventListener('message',listener);
            socket.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));
        });
    }
    let verified=false;
    try {
        const identity=JSON.parse(await evaluate("JSON.stringify({pid:process.pid,cwd:process.cwd(),profile:process.env.NODE_PROFILE||'main',handlers:process.listenerCount('SIGINT')})"));
        if(identity.pid!==pid||canonical(identity.cwd)!==canonical(root)||identity.profile!==profile||identity.handlers<1) throw new Error('Debugger process does not match the selected engine and shutdown handler.');
        verified=true;
        await evaluate("setTimeout(() => process.emit('SIGINT'), 250); 'graceful-shutdown-scheduled'");
        console.log(JSON.stringify({pid,profile,gracefulShutdownRequested:true}));
    } catch(error) {
        if(verified) await evaluate("setTimeout(() => process.getBuiltinModule('node:inspector').close(),250); 'debugger-close-scheduled'").catch(()=>{});
        throw error;
    } finally {socket.close();}
    for(let i=0;i<120;i++) {
        try { process.kill(pid,0); } catch { return {stopped:true,pid}; }
        await sleep(500);
    }
    throw new Error('The selected engine has not finished its graceful shutdown. No force termination attempted.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
    try {if(!process.argv[2]) throw new Error('Provide the selected engine directory.');console.log(JSON.stringify(await gracefulNodeStop(process.argv[2])));}
    catch(error){console.error(error.message);process.exitCode=1;}
}
