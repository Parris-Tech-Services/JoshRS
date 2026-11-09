#!/usr/bin/env bun
/**
 * RS-SDK MCP stdio adapter for Agy: ONE family bot HarnessView1.
 * Real upstream execute_code / BotActions; no simulated movement receipts.
 *
 * Default --check: read only. --init: private interactive credentials.
 * --serve: actual MCP stdio, NO user prompts and no stdout other than MCP.
 * Does NOT start/restart any JoshRS server, replace accounts or edit saves.
 */
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createBotOnlyManager} from './mcp-session.mjs';
import {BOT,WORLD,PIN,SDK_DIR,SECRETS,metadata,verifyApproval,
  initPrivateSecrets,ensureRegularUser} from './mcp-private.mjs';

const mode=process.argv[2]??'--check';
const self=fileURLToPath(import.meta.url);
function pinned() {
 const target=path.join(SDK_DIR,'package.json');
 if(!fs.existsSync(target))throw new Error('pinned_RS_SDK_missing_run_setup_fedora_first');
 return createRequire(target);
}
function resolveModule(requireFromSdk,packagePath) {
 return import(pathToFileURL(requireFromSdk.resolve(packagePath)).href);
}
function printConfig() {
 ensureRegularUser();
 const config={mcpServers:{"joshrs-harnessview1":{
  command:process.execPath,
  args:[self,'--serve'],
  cwd:path.dirname(self),
  env:{JOSHRS_FAMILY_SDK_APPROVED:BOT,RS377_FAMILY_SERVER_INSTRUMENTED:'true'},
  enabledTools:['list_bots','execute_code','disconnect_bot']
 }}};
 process.stdout.write(JSON.stringify(config,null,2)+'\n');
}
export function safeRequestBot(name) {
 if(name!==BOT)throw new Error('MCP may control HarnessView1 only');
 return BOT;
}
export function inspectSetup() {
 ensureRegularUser();
 return {bot:BOT,world:WORLD,pinnedSDK:fs.existsSync(path.join(SDK_DIR,'package.json')),
  ...metadata(),mcpMode:'stdio_loopback_single_controller',
  serverObserverInstalled:'NOT_VERIFIED',
  liveGameControl:'NOT_VERIFIED'};
}
async function serve(){
 verifyApproval();
 const fromSdk=pinned();
 const [{Server},{StdioServerTransport},schemas,executor]=await Promise.all([
  resolveModule(fromSdk,'@modelcontextprotocol/sdk/server/index.js'),
  resolveModule(fromSdk,'@modelcontextprotocol/sdk/server/stdio.js'),
  resolveModule(fromSdk,'@modelcontextprotocol/sdk/types.js'),
  import(pathToFileURL(path.join(SDK_DIR,'mcp/execute-code.ts')).href)
 ]);
 const {CallToolRequestSchema,ListToolsRequestSchema,
  ListResourcesRequestSchema,ReadResourceRequestSchema}=schemas;
 const {executeCode,executionError,botExecutions,
   EXECUTE_CODE_OUTPUT_SCHEMA}=executor;
 const manager=createBotOnlyManager();
 const server=new Server({name:'joshrs-377-harnessview1',version:'0.1.0'},
  {capabilities:{resources:{},tools:{}},
   instructions:'Controls ONLY authenticated HarnessView1 in the JoshRS Fedora family world. Use list_bots first. execute_code runs REAL pinned RS-SDK BotActions; NEVER claim completion from packet dispatch. The world server and other players are off-limits. Finish each quest by checking actual quest varp, inventory/XP/QP and relog evidence. Do not run concurrent controllers.'});
 server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:[
  {name:'list_bots',description:'Read-only: connected HarnessView1 status, no server or bot login.',inputSchema:{type:'object',properties:{}}},
  {name:'execute_code',
   description:'Execute TypeScript using the ORIGINAL pinned RS-SDK bot and sdk, for HarnessView1 ONLY. A direct action never counts as success without a verified state change. Exactly one of code or script.',
   inputSchema:{type:'object',properties:{
    bot_name:{type:'string',enum:[BOT]},code:{type:'string'},
    script:{type:'string'},args:{description:'JSON parameters to code'},
    world:{type:'string',enum:['none','brief','full']},
    timeout:{type:'number',minimum:0.1,maximum:60}},
    required:['bot_name']},
   outputSchema:EXECUTE_CODE_OUTPUT_SCHEMA},
  {name:'disconnect_bot',description:'Disconnect only HarnessView1 MCP bot session. Does not stop the family world.',
   inputSchema:{type:'object',properties:{name:{type:'string',enum:[BOT]}},required:['name']}}
 ]}));
 server.setRequestHandler(ListResourcesRequestSchema,async()=>({resources:[{
  uri:'file://../sdk/API.md',name:'Pinned original RS-SDK API',
  description:'Exact BotActions and BotSDK methods from the pinned upstream source',mimeType:'text/markdown'
 }]}));
 server.setRequestHandler(ReadResourceRequestSchema,async req=>{
  if(req.params.uri!=='file://../sdk/API.md')throw new Error('resource_not_allowed');
  const data=fs.readFileSync(path.join(SDK_DIR,'sdk/API.md'),'utf8');
  return {contents:[{uri:req.params.uri,mimeType:'text/markdown',text:data}]};
 });
 server.setRequestHandler(CallToolRequestSchema,async(req,extra)=>{
  const {name,arguments:input={}}=req.params;
  const args=input??{};
  if(name==='list_bots'){
   return {content:[{type:'text',text:JSON.stringify({bots:manager.list(),count:manager.list().length})}]};
  }
  if(name==='disconnect_bot'){
   try{
    safeRequestBot(args.name);
    await botExecutions.run(BOT,extra.signal,()=>manager.disconnect(BOT));
    return {content:[{type:'text',text:JSON.stringify({disconnected:BOT,worldStopped:false})}]};
   }catch{return {content:[{type:'text',text:'Only HarnessView1 can be disconnected'}],isError:true}}
  }
  if(name==='execute_code'){
   try{safeRequestBot(args.bot_name)}
   catch{return executionError('invalid_input','Only HarnessView1 is authorised')}
   if((typeof args.code==='string')===(typeof args.script==='string') ||
      (typeof args.code==='string'&&!args.code.trim())||
      (typeof args.script==='string'&&!args.script.trim()))
    return executionError('invalid_input','Provide exactly one nonempty code or script');
   if(args.world!==undefined&&!['none','brief','full'].includes(args.world))
    return executionError('invalid_input','Invalid world mode');
   const timeout=Math.min(Math.max(Number(args.timeout)||2,0.1),60)*60000;
   return executeCode(manager,BOT,args.code??{script:args.script},
    timeout,extra.signal,botExecutions,{args:args.args,world:args.world??'brief'});
  }
  return {content:[{type:'text',text:'Unsupported tool'}],isError:true};
 });
 const transport=new StdioServerTransport();
 const cleanup=async()=>{
  try{await manager.close()}catch{}
  try{await server.close()}catch{}
 };
 process.on('SIGTERM',()=>{void cleanup().finally(()=>process.exit(0))});
 process.on('SIGINT',()=>{void cleanup().finally(()=>process.exit(0))});
 await server.connect(transport);
 console.error('JoshRS MCP active: stdio, HarnessView1 only; game connection on first execute_code.');
}
if(import.meta.main) {
 try{
  if(mode==='--init')await initPrivateSecrets();
  else if(mode==='--check')console.log(JSON.stringify(inspectSetup(),null,2));
  else if(mode==='--print-config')printConfig();
  else if(mode==='--serve')await serve();
  else throw new Error('Usage: bun mcp-server.mjs --check|--init|--print-config|--serve');
 }catch(err){
  console.error('BLOCKED: '+String(err?.message??err).replace(/[\r\n]+/g,' ').slice(0,200));
  process.exitCode=1;
 }
}
