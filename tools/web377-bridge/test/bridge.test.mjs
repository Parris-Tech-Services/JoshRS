import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:net'
import WebSocket from 'ws'
import {startBridge} from '../bridge.mjs'

async function tcpEcho(){
 const server=createServer(socket=>socket.on('data',data=>socket.write(data)))
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
 return server
}
function wsOpen(url,origin){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket(url,{origin})
  ws.once('open',()=>resolve(ws))
  ws.once('error',reject)
 })
}
test('local 377 binary websocket forwards bytes to TCP and back',async()=>{
 const tcp=await tcpEcho()
 const bridge=await startBridge({listenPort:0,targetPort:tcp.address().port})
 try{
  const port=bridge.address().port
  const ws=await wsOpen('ws://127.0.0.1:'+port+'/','http://127.0.0.1:8080')
  assert.equal(bridge.clients(),1)
  const received=new Promise((resolve,reject)=>{ws.once('message',resolve);ws.once('error',reject)})
  ws.send(Buffer.from([0,255,32,41]),{binary:true})
  assert.deepEqual(Buffer.from(await received),Buffer.from([0,255,32,41]))
  ws.close()
  await new Promise(resolve=>ws.once('close',resolve))
 } finally {await bridge.close();await new Promise(resolve=>tcp.close(resolve))}
})
test('rejects unapproved origins, remote binds and invalid ports',async()=>{
 const tcp=await tcpEcho()
 const bridge=await startBridge({listenPort:0,targetPort:tcp.address().port})
 try {
  await assert.rejects(wsOpen('ws://127.0.0.1:'+bridge.address().port+'/','http://evil.example'),/403/)
  await assert.rejects(startBridge({listenHost:'0.0.0.0',listenPort:0,targetPort:tcp.address().port}),/loopback/)
  await assert.rejects(startBridge({listenPort:0,targetPort:0}),/target port/)
 } finally {await bridge.close();await new Promise(resolve=>tcp.close(resolve))}
})
