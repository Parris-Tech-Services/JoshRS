// Task 37: redacted evidence helpers. Never accept free-text account data.
export const choices = values => new Set(values.split(' '));
export const kinds=choices('source fedora disposable377 same_world gameplay');
export const outcomes=choices('pass fail blocked unverified');
export const actionKinds=choices('observe client_login walk npc_option loc_option ground_take inventory_option item_on_loc dialog_option bank_deposit bank_withdraw gather chat follow logout relogin run_tests');
export const actionResults=choices('observed sent failed blocked unverified');
export const actors=choices('bot player server observer');
export function reject(reason){throw Error(reason);}
export function shape(o,keys,name){
 if(!o||typeof o!=='object'||Array.isArray(o)||
 Object.keys(o).length!==keys.length||
 Object.keys(o).some(k=>!keys.includes(k)))reject('invalid_'+name+'_fields');
}
export function date(s){
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s))reject('invalid_timestamp');
 const t=Date.parse(s);
 if(!Number.isFinite(t))reject('invalid_timestamp');
 const canon=new Date(t).toISOString();
 if(s!==canon&&s!==canon.replace('.000Z','Z'))reject('invalid_timestamp');
 return t;
}
export function hash(s,len,name,nonzero=false){
 if(typeof s!=='string'||s.length!==len||!/^[a-f0-9]+$/.test(s)||(nonzero&&!/[1-9a-f]/.test(s)))reject('invalid_'+name);
}
export function id(s,name){
 if(typeof s!=='string'||!/^[a-z][a-z0-9_]{1,63}$/.test(s))reject('invalid_'+name);
}
export function status(s){if(!outcomes.has(s))reject('invalid_outcome');}
