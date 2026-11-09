/**
 * Minimal normal revision-377 TCP session for Agy to extend.
 * Tested login + allowed movement packets, NOT an RS-SDK state decoder.
 *
 * No automatic registration, no reconnect loop, no arbitrary packets, no
 * private keys, no real human account credentials. Connect only with approval.
 */
import net from 'node:net';
import {EventEmitter} from 'node:events';
import {Isaac377,encode377Login,encode377Move,encode377ClientPacket} from './codec.mjs';

function privateHost(host){
  if(host==='localhost'||host==='127.0.0.1'||host==='::1'||host.endsWith('.ts.net')||host.endsWith('.local'))return true;
  if(net.isIP(host)!==4)return false;
  const p=host.split('.').map(Number);
  return p[0]===10||p[0]===127||(p[0]===172&&p[1]>=16&&p[1]<=31)||
    (p[0]===192&&p[1]===168)||(p[0]===100&&p[1]>=64&&p[1]<=127);
}
export function validate377Target({host='127.0.0.1',port=53402,world='isolated',approvedLive=false}={}){
  if(typeof host!=='string'||!privateHost(host))throw new Error('Only loopback or private LAN/Tailscale target allowed');
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid game port');
  if(!['isolated','family'].includes(world))throw new Error('Unknown world type');
  if(world==='family'&&!approvedLive)throw new Error('Live family world requires explicit operator approval');
  if(world==='isolated'&&[52402,8888,45099,43500].includes(port))throw new Error('Production service port prohibited for isolated mode');
  return Object.freeze({host,port,world});
}
export class Client377 extends EventEmitter {
  constructor(options){
    super();
    const {
      host='127.0.0.1',port=53402,world='isolated',approvedLive=false,
      username,password,publicKeyPem,crc,timeoutMs=10000,keepaliveMs=3000
    }=options??{};
    this.target=validate377Target({host,port,world,approvedLive});
    if(!username||!password||!publicKeyPem||!Buffer.isBuffer(crc))throw new Error('Bot credentials, PUBLIC RSA key and server cache CRC required');
    if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)throw new Error('Invalid login timeout');
    if(!Number.isInteger(keepaliveMs)||keepaliveMs<1000||keepaliveMs>30000)throw new Error('Invalid keepalive interval');
    this.auth={username,password,publicKeyPem,crc};
    this.timeoutMs=timeoutMs;this.keepaliveMs=keepaliveMs;
    this.socket=null;this.isaac=null;this.connected=false;this.stopped=false;
    this.keepalive=null;this.loginPromise=null;this.bytesReceived=0;
  }
  async connect(){
    if(this.stopped)throw new Error('Closed client cannot reconnect; create a new instance');
    if(this.loginPromise||this.connected)throw new Error('Already connecting/connected; only one session allowed');
    this.loginPromise=new Promise((resolve,reject)=>{
      const socket=net.createConnection({host:this.target.host,port:this.target.port});
      this.socket=socket;
      let incoming=Buffer.alloc(0),phase=0,settled=false;
      const deadline=setTimeout(()=>fail(new Error('377 login timed out')),this.timeoutMs);
      const clear=()=>clearTimeout(deadline);
      const fail=error=>{
        if(settled)return;
        settled=true;clear();this.stopped=true;
        socket.destroy();reject(error);
      };
      socket.on('connect',()=>{
        if(!this.stopped)socket.write(Buffer.from([14,0]));
      });
      socket.on('data',chunk=>{
        this.bytesReceived+=chunk.length;
        // Incoming *game* packets are not decoded yet. They must NEVER be
        // represented as valid world observations by the planner.
        if(phase===2)return;
        incoming=Buffer.concat([incoming,chunk]);
        while(true){
          if(phase===0){
            if(incoming.length<17)return;
            incoming=incoming.subarray(17);phase=1;
            try{
              const {packet,seed}=encode377Login(this.auth);
              this.isaac=new Isaac377(seed);
              socket.write(packet);
            }catch(e){fail(e);return;}
          }
          if(phase===1){
            if(incoming.length<1)return;
            const reply=incoming[0];incoming=incoming.subarray(1);
            if(reply!==2&&reply!==15){
              fail(new Error('377 login rejected (response '+reply+'); no account changes attempted by client'));
              return;
            }
            phase=2;this.connected=true;settled=true;clear();
            this.keepalive=setInterval(()=>{
              try{this.sendNoTimeout()}catch(e){this.emit('client-error',e);this.close();}
            },this.keepaliveMs);
            this.keepalive.unref?.();
            // This establishes login, NOT proof the bot appears to other players.
            this.emit('login',{username:this.auth.username,world:this.target.world,response:reply});
            resolve({username:this.auth.username,response:reply,world:this.target.world});
            incoming=Buffer.alloc(0);return;
          }
          return;
        }
      });
      socket.on('error',error=>{
        if(!settled)fail(error);
        else this.emit('client-error',error);
      });
      socket.on('close',()=>{
        if(!settled){fail(new Error('377 TCP session closed before authentication'));return;}
        this.connected=false;
        if(this.keepalive){clearInterval(this.keepalive);this.keepalive=null;}
        this.emit('disconnected');
      });
    });
    return this.loginPromise;
  }
  sendNoTimeout(){
    if(!this.connected||this.stopped||!this.socket||this.socket.destroyed||!this.isaac)throw new Error('Bot not authenticated');
    this.socket.write(encode377ClientPacket(this.isaac,40));
  }
  walkTo(x,z){
    if(!this.connected||this.stopped||!this.socket||this.socket.destroyed||!this.isaac)throw new Error('Bot not authenticated');
    this.socket.write(encode377ClientPacket(this.isaac,28,encode377Move(x,z),true));
    return {status:'dispatched_unverified',x,z,reason:'Cannot confirm movement until native 377 world state parser exists'};
  }
  status(){
    return {connected:this.connected&&!this.stopped,world:this.target.world,username:this.auth.username,
      bytesReceived:this.bytesReceived,hasWorldState:false};
  }
  close(){
    if(this.stopped)return;
    this.stopped=true;this.connected=false;
    if(this.keepalive){clearInterval(this.keepalive);this.keepalive=null;}
    this.socket?.destroy();
  }
}
