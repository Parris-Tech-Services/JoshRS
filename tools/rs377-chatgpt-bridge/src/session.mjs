/**
 * Safely bounded, opt-in, normal #377 TCP login. No server or network is opened
 * by importing this module; initial mode is an explicitly named isolated world.
 * No automatic registration, reconnect, account selection or permanent secrets.
 */
import net from 'node:net';
import {buildAction, buildLogin, framePacket, freshSeed, verifiedBuiltPacket} from './protocol.mjs';

export function checkTarget({host,port,mode='isolated',approvedFamily=false}={}) {
  if(typeof host!=='string')throw new Error('Explicit host required');
  const clean=host.toLowerCase();
  if (!(clean==='localhost'||clean==='127.0.0.1'||clean==='::1'||
       (net.isIP(clean)===4&&(()=>{
         const n=clean.split('.').map(Number);
         return n[0]===10||(n[0]===172&&n[1]>=16&&n[1]<=31)||
           (n[0]===192&&n[1]===168)||(n[0]===100&&n[1]>=64&&n[1]<=127);
       })())))
    throw new Error('Only explicit loopback or private LAN/Tailscale IP allowed (no public DNS)');
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid game port');
  if(!['isolated','family'].includes(mode))throw new Error('Unknown world mode');
  if(mode==='family'&&!approvedFamily)throw new Error('Family world requires explicit approval');
  if(mode==='isolated'&&[52402,8888,45099,43500].includes(port))
    throw new Error('Production port forbidden in isolated mode');
  return Object.freeze({host,port,mode});
}

export class Session377 {
  constructor(options={}) {
    const {target,username,password,publicKeyPem,crcs,uid=0,seedFactory=freshSeed,
      dial=(port,host)=>net.connect(port,host),timeoutMs=7000} = options;
    this.target=checkTarget(target);
    if(typeof username!=='string'||!/^Harness[A-Za-z0-9_-]{1,10}$/.test(username))
      throw new Error('Use explicitly named disposable Harness bot identity');
    if(typeof password!=='string'||!password)throw new Error('Disposable password required');
    if(!Buffer.isBuffer(crcs)||crcs.length!==36)throw new Error('Exact 36-byte CRC required');
    if(typeof seedFactory!=='function'||typeof dial!=='function')throw new Error('Invalid transport setup');
    if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)throw new Error('Invalid timeout');
    this.identity=username;
    this.credentials={password,publicKeyPem,crcs:Buffer.from(crcs),uid};
    this.seedFactory=seedFactory;this.dial=dial;this.timeoutMs=timeoutMs;
    this.socket=null;this.isaac=null;this.stage='idle';this.bytesReceived=0;this.closed=false;
  }
  status(){
    return Object.freeze({
      mode:this.target.mode,authenticated:this.stage==='authenticated'&&!this.closed,
      stage:this.stage,bytesReceived:this.bytesReceived,hasWorldState:false,
      evidence:'TCP login only: no world decoder and no observed game tick',
    });
  }
  async connect(){
    if(this.closed||this.stage!=='idle')throw new Error('Session already used; no duplicate login');
    this.stage='connecting';
    const s=this.dial(this.target.port,this.target.host);
    this.socket=s;let buffer=Buffer.alloc(0),settled=false;
    const result=await new Promise((resolve,reject)=>{
      const fail=(category)=>{
        if(settled)return;
        settled=true;this.stage='failed';this.closed=true;clearTimeout(timeout);
        try{s.destroy()}catch{}
        reject(new Error(category)); // never include user, password, keys or remote bytes
      };
      const timeout=setTimeout(()=>fail('377 login timeout'),this.timeoutMs);
      s.on('connect',()=>{if(!this.closed)s.write(Buffer.from([14,0]))});
      s.on('data',chunk=>{
        if(!Buffer.isBuffer(chunk)){fail('377 malformed transport data');return}
        this.bytesReceived+=chunk.length;
        if(this.stage==='authenticated')return; // incoming game packets not yet decoded
        buffer=Buffer.concat([buffer,chunk]);
        if(buffer.length>8192){fail('377 oversized login response');return}
        try{
          while(true){
            if(this.stage==='connecting'){
              if(buffer.length<17)return;
              // Server responds to initial [14,0] with eight leading zeros, status,
              // and eight seed bytes (World.onClientData).
              if(buffer[8]!==0){fail('377 initial handshake rejected');return}
              buffer=buffer.subarray(17);
              const made=buildLogin({username:this.identity,...this.credentials,seed:this.seedFactory()});
              this.isaac=made.outboundIsaac;
              s.write(made.packet);this.stage='awaiting_reply';continue;
            }
            if(this.stage==='awaiting_reply'){
              if(buffer.length<1)return;
              const code=buffer[0];
              if(code!==2){fail('377 authentication rejected with code '+code);return}
              // Normal game login reply includes staff level and mouse tracking flag.
              // Do not interpret an incomplete response as an authenticated game.
              if(buffer.length<3)return;
              this.stage='authenticated';settled=true;clearTimeout(timeout);
              buffer=Buffer.alloc(0);
              resolve(Object.freeze({authenticated:true,response:2,world:this.target.mode,hasWorldState:false}));
              return;
            }
            return;
          }
        }catch{fail('377 handshake encoding or framing failed')}
      });
      s.on('error',()=>fail('377 socket error'));
      s.on('close',()=>{if(!settled)fail('377 connection closed before login');else {this.closed=true;this.stage='closed'}});
    });
    return result;
  }
  send(action) {
    return this.sendPacket(buildAction(action));
  }
  sendPacket(packet) {
    if(this.stage!=='authenticated'||this.closed||!this.socket||this.socket.destroyed)
      throw new Error('No authenticated disposable bot session');
    // WeakMap-branded from buildAction(), not merely a plausible {opcode,body}
    // supplied by an SDK caller or compromised external controller.
    const safe=verifiedBuiltPacket(packet);
    if(!this.socket.write(framePacket(safe,this.isaac))) {
      // Backpressure means queued; it does not prove an effect.
      return {status:'queued_unverified',hasWorldState:false};
    }
    return {status:'dispatched_unverified',hasWorldState:false};
  }
  close(){
    if(this.closed)return Object.freeze({status:'closed_unverified_save'});
    this.closed=true;this.stage='closed';this.isaac=null;
    this.credentials=null;
    // Graceful TCP FIN, not a fabricated game logout or save confirmation.
    try{this.socket?.end()}catch{}
    return Object.freeze({status:'closed_unverified_save'});
  }
}
