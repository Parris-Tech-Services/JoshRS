/**
 * Source-only rev-377 protocol library. Independent of Agy's draft PR #62.
 * Sources: pinned Engine-TS ClientGameProt.ts, codec/{MoveClick,OpNpc,OpLoc,
 * OpObj,InvButton,OpLocU,ResumePauseButton,MessagePublic}Decoder.ts,
 * io/Packet.ts p2_alt* and Java Client.java login().
 * No live host, credentials, privileged packets, or automatic side effects.
 */
import {createPublicKey, randomBytes} from 'node:crypto';
import {packWord377,nameToBase37} from './wordpack377.mjs';

const uint = (v, max, field) => {
  if (!Number.isSafeInteger(v) || v < 0 || v > max) throw new RangeError('Invalid '+field);
  return v;
};
const word = (v, field) => uint(v, 65535, field);
const byte = (v, field) => uint(v, 255, field);
const u16 = n => Buffer.from([n >>> 8, n & 255]);
export const p2 = n => u16(word(n,'word'));
export const p2alt1 = n => {word(n,'word');return Buffer.from([n&255,n>>>8])};
export const p2alt2 = n => {word(n,'word');return Buffer.from([n>>>8,(n+128)&255])};
export const p2alt3 = n => {word(n,'word');return Buffer.from([(n+128)&255,n>>>8])};
const two = (v, kind) => (kind === 'normal' ? p2(v) : kind === 'a1' ? p2alt1(v) : kind === 'a2' ? p2alt2(v) : p2alt3(v));
const payload = (opcode, body, variable=false) => {
  if (!Buffer.isBuffer(body)) throw new TypeError('Packet body must be a Buffer');
  if (variable && body.length > 255) throw new RangeError('Variable packet too long');
  return Object.freeze({opcode, body:Buffer.from(body), variable});
};

export const OPCODES = Object.freeze({
  NO_TIMEOUT:40, MOVE_GAMECLICK:28, MOVE_OPCLICK:247,
  NPC:[112,67,13,42,8], LOC:[181,241,50,136,55],
  GROUND:[77,100,71,54,230], INV:[3,177,91,231,158],
  HELD:[203,24,161,228,4],
  ITEM_ON_LOC:152, DIALOG_RESUME:226, PUBLIC_CHAT:49
});
function option(n) {return uint(n,5,'option') || (()=>{throw new RangeError('Option must be 1..5')})()}
const tile=(v,name)=>uint(v,16383,name);
/**
 * Exact native 377 decoder-compatible packets, pinned to Engine-TS
 * ClientGameProt.ts plus codec/OpPlayer,OpNpcU/T,OpHeldU/T,OpObjT,
 * IfButton,ResumePCountDialog,MessagePrivate decoders.
 * Sending a packet only reports dispatch, not effect or persistence.
 */
export const EXTRA_PACKET_TYPES=Object.freeze([
  'player','if_button','close_modal','item_on_item','item_on_npc',
  'spell_on_npc','spell_on_player','spell_on_item','spell_on_ground',
  'resume_count','chat_plain','private_chat','friend_add'
]);
const EXTRA=new Set(EXTRA_PACKET_TYPES);
function buildExtendedPacket(a){
 const names={
  player:['playerSlot','option'],
  if_button:['componentId'],close_modal:[],
  item_on_item:['sourceItemId','sourceSlot','targetItemId','targetSlot','componentId'],
  item_on_npc:['npcSlot','itemId','slot','componentId'],
  spell_on_npc:['npcSlot','spellComponent'],
  spell_on_player:['playerSlot','spellComponent'],
  spell_on_item:['itemId','slot','componentId','spellComponent'],
  spell_on_ground:['x','z','itemId','spellComponent'],
  resume_count:['value'],chat_plain:['message'],private_chat:['targetName','message'],
  friend_add:['targetName']
 }[a.type];
 if(!names||Object.keys(a).some(k=>k!=='type'&&!names.includes(k)))
  throw new Error('Unexpected or unverified extended 377 action fields');
 switch(a.type){
  case 'player':{
   const n=option(a.option),slot=word(a.playerSlot,'playerSlot');
   const alts=[null,p2alt3,p2alt2,p2alt1,p2alt1,p2alt2];
   return payload([245,233,194,116,45][n-1],alts[n](slot));
  }
  case 'if_button':return payload(79,p2(word(a.componentId,'componentId')));
  case 'close_modal':return payload(110,Buffer.alloc(0));
  case 'item_on_item':return payload(1,Buffer.concat([
   p2(word(a.targetItemId,'targetItemId')),
   p2alt1(word(a.sourceSlot,'sourceSlot')),
   p2alt1(word(a.sourceItemId,'sourceItemId')),
   p2alt3(word(a.componentId,'componentId')),
   p2alt2(word(a.targetSlot,'targetSlot')),
   p2alt2(word(a.componentId,'componentId'))
  ]));
  case 'item_on_npc':return payload(57,Buffer.concat([
   p2(word(a.npcSlot,'npcSlot')),
   p2alt1(word(a.itemId,'itemId')),
   p2alt3(word(a.componentId,'componentId')),
   p2(word(a.slot,'slot'))
  ]));
  case 'spell_on_npc':return payload(104,Buffer.concat([
   p2alt2(word(a.spellComponent,'spellComponent')),
   p2alt1(word(a.npcSlot,'npcSlot'))
  ]));
  case 'spell_on_player':return payload(31,Buffer.concat([
   p2(word(a.playerSlot,'playerSlot')),
   p2alt1(word(a.spellComponent,'spellComponent'))
  ]));
  case 'spell_on_item':return payload(36,Buffer.concat([
   p2(word(a.spellComponent,'spellComponent')),
   p2alt2(word(a.componentId,'componentId')),
   p2alt2(word(a.slot,'slot')),
   p2alt2(word(a.itemId,'itemId'))
  ]));
  case 'spell_on_ground':return payload(83,Buffer.concat([
   p2alt1(word(a.itemId,'itemId')),p2(tile(a.z,'z')),
   p2alt1(word(a.spellComponent,'spellComponent')),
   p2alt3(tile(a.x,'x'))
  ]));
  case 'resume_count':{
   if(!Number.isSafeInteger(a.value)||a.value<1||a.value>2147483647)
    throw new RangeError('377 count dialog requires a positive signed 32-bit value');
   const buf=Buffer.alloc(4);buf.writeInt32BE(a.value);
   return payload(75,buf);
  }
  case 'chat_plain':{
   const packed=packWord377(a.message);
   return payload(49,Buffer.concat([Buffer.from([0,0]),packed]),true);
  }
  case 'private_chat':{
   const name=nameToBase37(a.targetName);
   const packed=packWord377(a.message);
   const out=Buffer.alloc(8+packed.length);
   out.writeBigUInt64BE(name,0);packed.copy(out,8);
   return payload(227,out,true);
  }
  case 'friend_add':{
   // Native CLIENT FRIENDLIST_ADD (120, fixed 8), decoder buf.g8().
   // Only a normal authenticated session may send this packet; dispatch
   // alone does NOT prove the Friends worker persisted the relationship.
   const target=nameToBase37(a.targetName);
   const body=Buffer.alloc(8);body.writeBigUInt64BE(target,0);
   return payload(120,body);
  }
 }
 throw new Error('Unsupported native extended packet');
}

export function buildAction(action) {
  if (!action || typeof action!=='object' || Array.isArray(action))throw new TypeError('Action object required');
  if(EXTRA.has(action.type))return buildExtendedPacket(action);
  const fields = {
    walk:['x','z','running'], npc:['npcSlot','option'], loc:['x','z','locId','option'],
    ground:['x','z','itemId','option'], inventory:['componentId','itemId','slot','option'],
    held:['componentId','itemId','slot','option'],
    item_on_loc:['x','z','locId','componentId','itemId','slot'],
    dialog_resume:['componentId'], chat:['wordpack','color','effect'], keepalive:[], logout:[]
  }[action.type];
  if (!fields)throw new Error('Unsupported or privileged action');
  const extras=Object.keys(action).filter(k=>k!=='type'&&!fields.includes(k));
  if (extras.length)throw new Error('Unexpected action fields: '+extras.join(','));
  switch(action.type) {
    case 'walk': return payload(OPCODES.MOVE_GAMECLICK,Buffer.concat([
      p2alt3(tile(action.x,'x')),Buffer.from([action.running===true?1:0]),
      p2alt3(tile(action.z,'z'))]),true);
    case 'npc': {
      const n=option(action.option),slot=word(action.npcSlot,'npcSlot');
      return payload(OPCODES.NPC[n-1],two(slot,[null,'a1','a2','a3','a1','a1'][n]));
    }
    case 'loc': {
      const n=option(action.option),x=tile(action.x,'x'),z=tile(action.z,'z'),id=word(action.locId,'locId');
      const variants=[null,[p2alt2(x),p2alt1(z),p2alt1(id)],
        [p2(id),p2(x),p2alt2(z)],[p2alt2(z),p2alt1(id),p2alt3(x)],
        [p2(x),p2alt1(z),p2(id)],[p2alt1(id),p2alt1(z),p2(x)]];
      return payload(OPCODES.LOC[n-1],Buffer.concat(variants[n]));
    }
    case 'ground': {
      const n=option(action.option),x=tile(action.x,'x'),z=tile(action.z,'z'),id=word(action.itemId,'itemId');
      const variants=[null,[p2alt2(x),p2(z),p2alt3(id)],[p2(x),p2alt2(z),p2alt3(id)],
        [p2alt3(id),p2alt3(x),p2alt2(z)],[p2alt2(id),p2alt1(z),p2(x)],
        [p2alt1(id),p2alt2(x),p2(z)]];
      return payload(OPCODES.GROUND[n-1],Buffer.concat(variants[n]));
    }
    case 'inventory': {
      const n=option(action.option),id=word(action.itemId,'itemId'),
        slot=word(action.slot,'slot'),com=word(action.componentId,'componentId');
      const variants=[null,[p2alt2(id),p2(com),p2(slot)],
        [p2alt2(slot),p2alt1(id),p2alt1(com)],
        [p2alt1(id),p2alt3(slot),p2(com)],
        [p2alt3(com),p2alt1(slot),p2(id)],
        [p2alt3(slot),p2alt3(id),p2alt1(com)]];
      return payload(OPCODES.INV[n-1],Buffer.concat(variants[n]));
    }
    case 'held': {
      const n=option(action.option),id=word(action.itemId,'itemId'),
        slot=word(action.slot,'slot'),com=word(action.componentId,'componentId');
      const variants=[null,[p2alt2(com),p2alt1(slot),p2alt1(id)],
        [p2alt1(com),p2alt1(id),p2alt2(slot)],
        [p2alt3(slot),p2alt3(id),p2alt1(com)],
        [p2alt1(slot),p2alt2(id),p2(com)],
        [p2alt1(slot),p2alt3(id),p2alt3(com)]];
      return payload(OPCODES.HELD[n-1],Buffer.concat(variants[n]));
    }
    case 'item_on_loc': {
      const x=tile(action.x,'x'),z=tile(action.z,'z'),id=word(action.locId,'locId');
      return payload(OPCODES.ITEM_ON_LOC,Buffer.concat([
        p2alt1(id),p2alt1(word(action.componentId,'componentId')),
        p2alt1(word(action.itemId,'itemId')),p2alt1(z),
        p2(word(action.slot,'slot')),p2alt3(x)
      ]));
    }
    case 'dialog_resume':return payload(OPCODES.DIALOG_RESUME,p2(word(action.componentId,'componentId')));
    case 'chat': {
      if (!Buffer.isBuffer(action.wordpack)||action.wordpack.length===0||action.wordpack.length>78)
        throw new Error('Public chat requires a pre-encoded, verified 377 WordPack Buffer (1..78 bytes); no plaintext fallback');
      return payload(OPCODES.PUBLIC_CHAT,Buffer.concat([
        Buffer.from([byte(action.color??0,'color'),byte(action.effect??0,'effect')]),
        action.wordpack
      ]),true);
    }
    case 'keepalive':return payload(OPCODES.NO_TIMEOUT,Buffer.alloc(0));
    case 'logout':throw new Error('No verified logout opcode: use session.close() and confirm save/relog separately');
  }
}
export function framePacket(packet, isaac) {
  if (!isaac||typeof isaac.nextInt!=='function')throw new TypeError('ISAAC required');
  const code=Buffer.from([(packet.opcode+isaac.nextInt())&255]);
  return Buffer.concat([code,packet.variable?Buffer.from([packet.body.length]):Buffer.alloc(0),packet.body]);
}
export class Isaac377 {
  constructor(seed) {
    if(!Array.isArray(seed)||seed.length!==4||!seed.every(n=>Number.isInteger(n)))
      throw new Error('Exactly four ISAAC seeds required');
    this.rsl=new Int32Array(256);this.mem=new Int32Array(256);
    for(let i=0;i<4;i++)this.rsl[i]=seed[i];
    this.aa=0;this.bb=0;this.cc=0;this.count=0;this.init();
  }
  init() {
    let a=0x9e3779b9|0,b=a,c=a,d=a,e=a,f=a,g=a,h=a;
    const mix=()=>{
      a^=b<<11; d=d+a|0; b=b+c|0;
      b^=c>>>2; e=e+b|0; c=c+d|0;
      c^=d<<8; f=f+c|0; d=d+e|0;
      d^=e>>>16; g=g+d|0; e=e+f|0;
      e^=f<<10; h=h+e|0; f=f+g|0;
      f^=g>>>4; a=a+f|0; g=g+h|0;
      g^=h<<8; b=b+g|0; h=h+a|0;
      h^=a>>>9; c=c+h|0; a=a+b|0;
    };
    for(let j=0;j<4;j++)mix();
    for(let pass=0;pass<2;pass++)for(let i=0;i<256;i+=8) {
      const src=pass===0?this.rsl:this.mem;
      a=a+src[i]|0;b=b+src[i+1]|0;c=c+src[i+2]|0;d=d+src[i+3]|0;
      e=e+src[i+4]|0;f=f+src[i+5]|0;g=g+src[i+6]|0;h=h+src[i+7]|0;
      mix();[a,b,c,d,e,f,g,h].forEach((v,k)=>{this.mem[i+k]=v});
    }
    this.isaac();this.count=256;
  }
  isaac(){
    this.cc=this.cc+1|0;this.bb=this.bb+this.cc|0;
    for(let i=0;i<256;i++){
      const x=this.mem[i];
      if((i&3)===0)this.aa^=this.aa<<13;
      else if((i&3)===1)this.aa^=this.aa>>>6;
      else if((i&3)===2)this.aa^=this.aa<<2;
      else this.aa^=this.aa>>>16;
      this.aa=this.aa+this.mem[(i+128)&255]|0;
      const y=this.mem[(x>>>2)&255]+this.aa+this.bb|0;
      this.mem[i]=y;this.bb=this.mem[(y>>>10)&255]+x|0;this.rsl[i]=this.bb;
    }
  }
  nextInt(){
    if(this.count--===0){this.isaac();this.count=255}
    return this.rsl[this.count];
  }
}
function powmod(b,e,m){let out=1n;while(e>0n){if(e&1n)out=out*b%m;b=b*b%m;e>>=1n}return out}
const signed=(b)=>{let t=b.toString('hex');return t?BigInt('0x'+t):0n};
export function buildLogin({username,password,publicKeyPem,crcs,seed,uid=0,reconnect=false}) {
  if(typeof username!=='string'||!/^[a-z0-9 _-]{1,12}$/i.test(username))throw new Error('Invalid disposable username');
  if(typeof password!=='string'||password.length<1||password.length>20||/[\x00-\x1f\x7f]/.test(password))throw new Error('Invalid login password');
  if(!Buffer.isBuffer(crcs)||crcs.length!==36)throw new Error('Nine authentic 377 cache CRCs required');
  if(!Array.isArray(seed)||seed.length!==4||!seed.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=0xffffffff))throw new Error('Four uint32 seed values required');
  uint(uid,0xffffffff,'uid');
  if(typeof publicKeyPem!=='string'||!/-----BEGIN (?:PUBLIC KEY|RSA PUBLIC KEY)-----/.test(publicKeyPem)||
     /PRIVATE KEY/.test(publicKeyPem))throw new Error('Only PUBLIC RSA PEM accepted; no server private key');
  let key;
  try{key=createPublicKey(publicKeyPem).export({format:'jwk'})}catch{throw new Error('Invalid PUBLIC RSA key')}
  if(key.kty!=='RSA'||!key.n||!key.e)throw new Error('Expected an RSA public key');
  const mod=signed(Buffer.from(key.n,'base64url')),exp=signed(Buffer.from(key.e,'base64url'));
  const seedBytes=Buffer.alloc(16);seed.forEach((x,i)=>seedBytes.writeUInt32BE(x,i*4));
  const device=Buffer.alloc(4);device.writeUInt32BE(uid);
  const secret=Buffer.concat([Buffer.from([10]),seedBytes,device,Buffer.from(username+'\n'+password+'\n','latin1')]);
  if(signed(secret)>=mod)throw new Error('RSA public modulus too small for login block');
  const ciphertext=powmod(signed(secret),exp,mod);
  let hex=ciphertext.toString(16);if(hex.length%2)hex='0'+hex;
  // Forge/Jagex treats RSA output as a signed big integer. Ensure a positive sign byte.
  let enc=Buffer.from(hex,'hex');if(enc[0]&0x80)enc=Buffer.concat([Buffer.from([0]),enc]);
  if(enc.length>255)throw new Error('RSA encrypted block too long');
  const body=Buffer.concat([Buffer.from([255,1,121,0]),crcs,Buffer.from([enc.length]),enc]);
  if(body.length>255)throw new Error('Login packet too long');
  return {
    packet:Buffer.concat([Buffer.from([reconnect?18:16,body.length]),body]),
    outboundIsaac:new Isaac377(seed),inboundIsaac:new Isaac377(seed.map(v=>(v+50)>>>0))
  };
}
export const freshSeed=()=>Array.from({length:4},(_,i)=>randomBytes(4).readUInt32BE(0));
