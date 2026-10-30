import {startBridge} from './bridge.mjs'
const options={}
for(let i=2;i<process.argv.length;i+=2){
 const key=process.argv[i],value=process.argv[i+1]
 if(!['--listen-port','--target-port','--origin'].includes(key)||!value)throw Error('Usage: node cli.mjs [--listen-port 43594] [--target-port 52402] [--origin http://127.0.0.1:8080]')
 if(key==='--listen-port')options.listenPort=Number(value)
 if(key==='--target-port')options.targetPort=Number(value)
 if(key==='--origin')options.origin=value
}
const bridge=await startBridge(options)
console.log('JoshRS 377 loopback gateway listening on 127.0.0.1:'+bridge.address().port)
console.log('This only translates binary WebSockets to TCP; it does NOT translate login packets or enable mobile access.')
console.log('Use Ctrl+C to stop. No player credentials are logged.')
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await bridge.close();process.exit(0)})
