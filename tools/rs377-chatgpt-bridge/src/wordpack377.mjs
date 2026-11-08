/**
 * Exact 377 WordPack symbol table and nibble encoder:
 * LostCityRS/Engine-TS@b5ac859... src/wordenc/WordPack.ts
 * No lossy fallback for unsupported Unicode or >80-character messages.
 */
const CHAR_LOOKUP=Object.freeze([
  ' ','e','t','a','o','i','h','n','s','r','d','l','u','m',
  'w','c','y','f','g','p','b','v','k','x','j','q','z',
  '0','1','2','3','4','5','6','7','8','9',
  ' ','!','?','.',',',':',';','(',')','-',
  '&','*','\\',"'",'@','#','+','=','£','$','%','"','[',']'
]);
export function packWord377(input){
 if(typeof input!=='string'||input.length<1||input.length>80)
  throw new RangeError('377 chat must be 1..80 characters; truncation forbidden');
 const bytes=[];let carry=-1;
 for(const ch of input.toLowerCase()){
  let n=CHAR_LOOKUP.indexOf(ch);
  if(n<0)throw new RangeError('Character is not in verified 377 WordPack alphabet');
  if(n>12)n+=195;
  if(carry===-1){
   if(n<13)carry=n;
   else bytes.push(n);
  }else if(n<13){bytes.push((carry<<4)+n);carry=-1}
  else{bytes.push((carry<<4)+(n>>4));carry=n&15}
 }
 if(carry!==-1)bytes.push(carry<<4);
 if(bytes.length<1||bytes.length>80)throw new RangeError('WordPack length out of range');
 return Buffer.from(bytes);
}
export function nameToBase37(name){
 if(typeof name!=='string'||!/^[a-zA-Z0-9_ ]{1,12}$/.test(name)||!name.trim())
  throw new RangeError('Invalid 377 private-message recipient');
 let value=0n;
 for(const c of name.trim()){
  const code=c.charCodeAt(0);
  value*=37n;
  if(code>=65&&code<=90)value+=BigInt(code-64);
  else if(code>=97&&code<=122)value+=BigInt(code-96);
  else if(code>=48&&code<=57)value+=BigInt(code-21);
 }
 while(value!==0n&&value%37n===0n)value/=37n;
 if(value<=0n||value>=6582952005840035281n)
  throw new RangeError('Invalid base37 recipient');
 return value;
}
