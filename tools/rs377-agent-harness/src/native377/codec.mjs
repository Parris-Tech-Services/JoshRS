/**
 * Authentic RS2 #377 client LOGIN/ISAAC/MOVE encoder extracted from the existing
 * JoshRS family companion reference. Public RSA key ONLY: never private.pem.
 * Does not attempt to decode world state or claim a movement completed.
 */
import {createPublicKey, randomBytes} from 'node:crypto';

const UINT32_MAX=0xffffffff;
function i32(v){return v|0;}
function asCoord(v,label) {
  if(!Number.isSafeInteger(v)||v<0||v>16383)throw new RangeError('Invalid '+label);
  return v;
}
export class Isaac377 {
  constructor(seed) {
    if(!Array.isArray(seed)||seed.length!==4||!seed.every(x=>Number.isInteger(x)&&x>=0&&x<=UINT32_MAX))throw new Error('ISAAC requires four unsigned 32-bit seed words');
    this.rsl=new Int32Array(256);
    this.mem=new Int32Array(256);
    this.aa=0;this.bb=0;this.cc=0;this.count=0;
    for(let i=0;i<4;i++)this.rsl[i]=seed[i];
    this.init();
  }
  init(){
    let a=i32(0x9e3779b9),b=a,c=a,d=a,e=a,f=a,g=a,h=a;
    const mix=()=>{
      a^=b<<11;d=i32(d+a);b=i32(b+c);
      b^=c>>>2;e=i32(e+b);c=i32(c+d);
      c^=d<<8;f=i32(f+c);d=i32(d+e);
      d^=e>>>16;g=i32(g+d);e=i32(e+f);
      e^=f<<10;h=i32(h+e);f=i32(f+g);
      f^=g>>>4;a=i32(a+f);g=i32(g+h);
      g^=h<<8;b=i32(b+g);h=i32(h+a);
      h^=a>>>9;c=i32(c+h);a=i32(a+b);
    };
    for(let i=0;i<4;i++)mix();
    for(let pass=0;pass<2;pass++){
      for(let i=0;i<256;i+=8){
        const source=pass===0?this.rsl:this.mem;
        a=i32(a+source[i]);b=i32(b+source[i+1]);c=i32(c+source[i+2]);d=i32(d+source[i+3]);
        e=i32(e+source[i+4]);f=i32(f+source[i+5]);g=i32(g+source[i+6]);h=i32(h+source[i+7]);
        mix();
        this.mem[i]=a;this.mem[i+1]=b;this.mem[i+2]=c;this.mem[i+3]=d;
        this.mem[i+4]=e;this.mem[i+5]=f;this.mem[i+6]=g;this.mem[i+7]=h;
      }
    }
    this.isaac();this.count=256;
  }
  isaac(){
    this.cc=i32(this.cc+1);this.bb=i32(this.bb+this.cc);
    for(let i=0;i<256;i++){
      const x=this.mem[i];
      if((i&3)===0)this.aa^=this.aa<<13;
      if((i&3)===1)this.aa^=this.aa>>>6;
      if((i&3)===2)this.aa^=this.aa<<2;
      if((i&3)===3)this.aa^=this.aa>>>16;
      this.aa=i32(this.aa+this.mem[(i+128)&255]);
      const y=i32(this.mem[(x>>>2)&255]+this.aa+this.bb);
      this.mem[i]=y;
      this.bb=i32(this.mem[(y>>>10)&255]+x);
      this.rsl[i]=this.bb;
    }
  }
  nextInt(){
    if(this.count===0){this.isaac();this.count=256;}
    return this.rsl[--this.count];
  }
}
function powMod(base,exponent,modulus){
  let result=1n,x=base%modulus,e=exponent;
  while(e>0n){if(e&1n)result=result*x%modulus;x=x*x%modulus;e>>=1n;}
  return result;
}
export function makeSeedWords(bytes=randomBytes(16)){
  if(!Buffer.isBuffer(bytes)||bytes.length!==16)throw new Error('Need 16 bytes of random seed');
  return [0,4,8,12].map(i=>bytes.readUInt32BE(i));
}
export function rsaPublicComponents(publicKeyPem){
  if(typeof publicKeyPem!=='string'||!/-----BEGIN (?:PUBLIC KEY|RSA PUBLIC KEY)-----/.test(publicKeyPem)||
    /PRIVATE KEY/.test(publicKeyPem))throw new Error('Only public RSA PEM accepted; never supply a private key');
  const key=createPublicKey(publicKeyPem);
  if(key.asymmetricKeyType!=='rsa')throw new Error('RSA public key required');
  const jwk=key.export({format:'jwk'});
  return {n:BigInt('0x'+Buffer.from(jwk.n,'base64url').toString('hex')),
    e:BigInt('0x'+Buffer.from(jwk.e,'base64url').toString('hex'))};
}
export function encode377Login({username,password,publicKeyPem,crc,seedWords,clientId=12345}){
  if(!/^[a-zA-Z0-9_ ]{1,12}$/.test(username??''))throw new Error('Invalid bot username');
  if(typeof password!=='string'||password.length<1||password.length>40||/[\x00\x0a]/.test(password))throw new Error('Invalid bot password');
  if(!Buffer.isBuffer(crc)||crc.length!==36)throw new Error('Exactly 36 cache CRC bytes required');
  const seed=seedWords??makeSeedWords();
  if(!Array.isArray(seed)||seed.length!==4||!seed.every(x=>Number.isInteger(x)&&x>=0&&x<=UINT32_MAX))throw new Error('Invalid seed words');
  const {n,e}=rsaPublicComponents(publicKeyPem);
  const parts=[Buffer.from([10]),Buffer.alloc(16),Buffer.alloc(4),Buffer.from(username,'ascii'),Buffer.from([10]),Buffer.from(password,'ascii'),Buffer.from([10])];
  for(let i=0;i<4;i++)parts[1].writeUInt32BE(seed[i],i*4);
  parts[2].writeUInt32BE(clientId>>>0);
  const plain=Buffer.concat(parts),m=BigInt('0x'+plain.toString('hex'));
  if(m>=n)throw new Error('Login payload exceeds RSA modulus');
  let hex=powMod(m,e,n).toString(16);
  if(hex.length%2)hex='0'+hex;
  const encrypted=Buffer.from(hex,'hex');
  if(encrypted.length>255)throw new Error('RSA block too large');
  const body=Buffer.alloc(1+2+1+36+1+encrypted.length);
  let p=0;
  body.writeUInt8(255,p++);body.writeUInt16BE(377,p);p+=2;body.writeUInt8(0,p++);
  crc.copy(body,p);p+=36;body.writeUInt8(encrypted.length,p++);encrypted.copy(body,p);
  if(body.length>255)throw new Error('Login packet too large');
  return {packet:Buffer.concat([Buffer.from([16,body.length]),body]),seed};
}
export function encode377Move(x,z){
  asCoord(x,'x');asCoord(z,'z');
  const buf=Buffer.alloc(5);
  buf[0]=(x+128)&255;buf[1]=(x>>8)&255;buf[2]=0;
  buf[3]=(z+128)&255;buf[4]=(z>>8)&255;
  return buf;
}
export function encode377ClientPacket(isaac,opcode,payload=Buffer.alloc(0),variable=false){
  if(!(isaac instanceof Isaac377)||![28,40].includes(opcode))throw new Error('Only allowed MOVE_GAMECLICK and NO_TIMEOUT packets');
  if(!Buffer.isBuffer(payload))throw new Error('Payload must be bytes');
  if((opcode===28&&(!variable||payload.length!==5))||(opcode===40&&(variable||payload.length!==0)))throw new Error('Invalid packet framing');
  const head=Buffer.from([(opcode+isaac.nextInt())&255]);
  return variable?Buffer.concat([head,Buffer.from([payload.length]),payload]):Buffer.concat([head,payload]);
}
