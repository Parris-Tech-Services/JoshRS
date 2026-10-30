import {createServer} from 'node:http'
import {createConnection} from 'node:net'
import {WebSocketServer} from 'ws'

/**
 * Optional localhost WebSocket -> raw TCP transport for the independently sourced 377 web client.
 * NO packet rewriting, account handling, or claim that Apollo and Lost City protocols are compatible.
 * Starts only on 127.0.0.1. Users must explicitly choose allowed browser Origin.
 */
export async function startBridge({
  listenPort=43594,targetPort=52402,origin='http://127.0.0.1:8080',
  listenHost='127.0.0.1',targetHost='127.0.0.1',maxClients=4
}={}) {
 if(listenHost!=='127.0.0.1'||targetHost!=='127.0.0.1')throw Error('Only 127.0.0.1 loopback is permitted')
 if(!Number.isInteger(listenPort)||listenPort<0||listenPort>65535)throw Error('Invalid listening port')
 if(!Number.isInteger(targetPort)||targetPort<1||targetPort>65535)throw Error('Invalid target port')
 if(!Number.isInteger(maxClients)||maxClients<1||maxClients>16)throw Error('Invalid maxClients')
 const allowed=new URL(origin)
 if(allowed.protocol!=='http:'||!['127.0.0.1','localhost'].includes(allowed.hostname)||allowed.pathname!=='/')throw Error('Origin must be a local http:// origin')
 const http=createServer((req,res)=>{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found')})
 const wss=new WebSocketServer({noServer:true,maxPayload:1024*1024,perMessageDeflate:false})
 let clients=0
 http.on('upgrade',(req,socket,head)=>{
  if(req.headers.origin!==allowed.origin||!['/','/game'].includes(req.url?.split('?')[0])) {
    socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
    socket.destroy()
    return
  }
  if(clients>=maxClients){
    socket.write('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
    socket.destroy()
    return
  }
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws))
 })
 wss.on('connection',ws=>{
  clients++
  const tcp=createConnection({host:targetHost,port:targetPort})
  let closed=false
  function shutdown(){
    if(closed)return
    closed=true
    clients=Math.max(0,clients-1)
    tcp.destroy()
    if(ws.readyState===ws.OPEN)ws.close(1000,'Connection ended')
    else ws.terminate()
  }
  tcp.on('error',()=>{if(ws.readyState===ws.OPEN)ws.close(1011,'Game server unavailable');shutdown()})
  tcp.on('close',shutdown)
  tcp.on('data',chunk=>{
   if(ws.readyState!==ws.OPEN)return
   if(ws.bufferedAmount>1024*1024){shutdown();return}
   tcp.pause()
   ws.send(chunk,{binary:true},error=>{if(error)shutdown();else tcp.resume()})
  })
  ws.on('message',(data,isBinary)=>{
   if(!isBinary){ws.close(1003,'Binary messages only');return}
   if(tcp.destroyed){shutdown();return}
   if(!tcp.write(data)) {ws.pause();tcp.once('drain',()=>{if(ws.readyState===ws.OPEN)ws.resume()})}
  })
  ws.on('close',shutdown)
  ws.on('error',shutdown)
 })
 await new Promise((resolve,reject)=>{
  http.once('error',reject)
  http.listen(listenPort,listenHost,()=>{http.off('error',reject);resolve()})
 })
 return {
  address:()=>http.address(),
  clients:()=>clients,
  async close(){
   for(const ws of wss.clients)ws.terminate()
   await new Promise(resolve=>wss.close(resolve))
   await new Promise(resolve=>http.close(resolve))
  }
 }
}
