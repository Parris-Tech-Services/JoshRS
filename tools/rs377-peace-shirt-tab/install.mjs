import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
export const BUTTON=18786;
export function patchList(text) {
    if(text.includes('[peace_shirt]')) throw new Error('Quest list already has a Peace Shirt entry.');
    const nl=text.includes('\r\n')?'\r\n':'\n';
    let scrollPatched=false,shifted=0;
    const changed=text.replace(/^(\[[^\]]+\]\r?\n)([\s\S]*?)(?=^\[|(?![\s\S]))/gm,(all,header,body)=>{
        if(header.trim()==='[com_0]') {
            if(!/^scroll=1610\r?$/m.test(body)) throw new Error('Unexpected native quest-list scroll layout.');
            scrollPatched=true;return header+body.replace(/^scroll=1610\r?$/m,'scroll=1630');
        }
        if(/^layer=com_0\r?$/m.test(body)) {
            if(!/^y=\d+\r?$/m.test(body)) throw new Error('Quest-list child has an unexpected position.');
            shifted++;
            return header+body.replace(/^y=(\d+)(\r?)$/m,(_,value,cr)=>'y='+(Number(value)+20)+cr);
        }
        return all;
    });
    if(!scrollPatched||shifted<100) throw new Error('Unexpected native quest-list structure.');
    return changed+nl+['[peace_shirt]','layer=com_0','type=text','x=10','y=8','buttontype=normal','width=145','height=14','font=p12_full','shadowed=yes','text=The Peace Shirt','colour=0xFF0000','overcolour=0xFFFFFF','option=The Peace Shirt',''].join(nl);
}
export function installTab(content,{apply=false}={}) {
    const root=fs.realpathSync(content);
    if(!root.toLowerCase().replaceAll('\\','/').startsWith('c:/joshrs-testworlds/')) throw new Error('Only a disposable test content tree is allowed.');
    const files=[
        ['scripts/interfaces/questlist.if',null],
        ['pack/interface.pack',null],
        ['pack/interface.order',null],
        ['scripts/joshrs_original/scripts/quest_peace_shirt.rs2',null],
        ['scripts/general/scripts/quests.rs2',null],
        ['scripts/joshrs_original/scripts/peace_shirt_tab.rs2','[if_button,questlist:peace_shirt]\n~joshrs_peace_shirt_journal;\n']
    ];
    const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
    files[0][1]=patchList(read(files[0][0]));
    const pack=read(files[1][0]);
    if(new RegExp(`^${BUTTON}=|=questlist:peace_shirt$`,'m').test(pack)||!/^18785=/m.test(pack)) throw new Error('Interface registry has drifted.');
    files[1][1]=pack.trimEnd()+`\n${BUTTON}=questlist:peace_shirt\n`;
    const order=read(files[2][0]);
    if(order.split(/\r?\n/).includes(String(BUTTON))) throw new Error('Component is already in the interface order.');
    files[2][1]=order.trimEnd()+`\n${BUTTON}\n`;
    const quest=read(files[3][0]);
    let count=0;
    files[3][1]=quest.replace(/(%varp_724 = [1-6];)/g,match=>{count++;return match+'\n~send_quest_progress_colour(questlist:peace_shirt, %varp_724, 6);';});
    if(count!==6) throw new Error('Expected six and only six quest stage transitions.');
    const general=read(files[4][0]);
    const anchor='[proc,update_questlist]';
    if(general.split(anchor).length!==2) throw new Error('Unexpected quest-list update procedure.');
    files[4][1]=general.replace(anchor,anchor+'\n~send_quest_progress_colour(questlist:peace_shirt, %varp_724, 6);');
    const changes=files.map(([relative,text])=>({relative,text,before:fs.existsSync(path.join(root,relative))?read(relative):null}));
    if(!apply) return {dryRun:true,files:changes.map(x=>x.relative),button:BUTTON};
    const backup=path.join(root,'.peace-shirt-tab-backup');
    fs.mkdirSync(backup,{recursive:false});
    for(let i=0;i<changes.length;i++) if(changes[i].before!==null) fs.writeFileSync(path.join(backup,String(i)),changes[i].before,{flag:'wx'});
    fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify(changes.map(({relative,before,text},i)=>({relative,backup:before===null?null:String(i),after:createHash('sha256').update(text).digest('hex')})),null,2));
    try {for(const c of changes)fs.writeFileSync(path.join(root,c.relative),c.text);}
    catch(error){for(const c of changes){const f=path.join(root,c.relative);if(c.before!==null)fs.writeFileSync(f,c.before);else if(fs.existsSync(f))fs.unlinkSync(f);}throw error;}
    return {dryRun:false,files:changes.map(x=>x.relative),button:BUTTON,backup};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
    try {const i=process.argv.indexOf('--content');if(i<0)throw new Error('Provide --content <disposable content> [--apply]');console.log(JSON.stringify(installTab(process.argv[i+1],{apply:process.argv.includes('--apply')}),null,2));}
    catch(error){console.error(error.message);process.exitCode=1;}
}
