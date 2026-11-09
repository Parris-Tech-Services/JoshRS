/** MCP stdio protocol smoke test; NEVER connects to a game. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import os from 'node:os';
import fs from 'node:fs';

const hash='db0cc51e0a8f9f0d6a7d60c44e534412bb0601bb';
const root=path.join(os.homedir(),'.local/share/joshrs','rs-sdk-'+hash);
const source=path.join(root,'package.json');
assert.ok(fs.existsSync(source),'install pinned original upstream SDK in the test home first');
const requireSdk=createRequire(source);
const [{Client},{StdioClientTransport}]=await Promise.all([
 import(pathToFileURL(requireSdk.resolve('@modelcontextprotocol/sdk/client/index.js')).href),
 import(pathToFileURL(requireSdk.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href)
]);
const server=path.join(import.meta.dir,'mcp-server.mjs');
const transport=new StdioClientTransport({
 command:process.execPath,args:[server,'--serve'],
 env:{...process.env,JOSHRS_FAMILY_SDK_APPROVED:'HarnessView1'}
});
const client=new Client({name:'joshrs-fedora-mcp-ci',version:'0.1.0'},{capabilities:{}});
let completed=false;
try {
 await client.connect(transport);
 const tools=await client.listTools();
 assert.deepEqual(tools.tools.map(x=>x.name).sort(),
   ['disconnect_bot','execute_code','list_bots']);
 const resources=await client.listResources();
 assert.ok(resources.resources.some(x=>x.uri==='file://../sdk/API.md'));
 const bots=await client.callTool({name:'list_bots',arguments:{}});
 const status=JSON.parse(bots.content[0].text);
 assert.equal(status.count,0,'listing must not login to a live or mock server');
 const blocked=await client.callTool({name:'execute_code',
  arguments:{bot_name:'Elrothiro',code:'return sdk.getState()'}});
 assert.equal(blocked.isError,true);
 assert.equal(blocked.structuredContent?.ok,false);
 assert.match(blocked.structuredContent?.error?.message??'',/HarnessView1/);
 const denied=await client.callTool({name:'disconnect_bot',arguments:{name:'Sylvie'}});
 assert.equal(denied.isError,true);
 const after=await client.callTool({name:'list_bots',arguments:{}});
 assert.equal(JSON.parse(after.content[0].text).count,0);
 completed=true;
 console.error('VERIFIED_MCP_STDIO_PROTOCOL_NO_GAME: 3 native tools; safe no-login status; Elrothiro and Sylvie rejected.');
} finally {
 await client.close().catch(()=>{});
 await transport.close().catch(()=>{});
}
assert.equal(completed,true);
