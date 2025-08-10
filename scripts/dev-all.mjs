#!/usr/bin/env node
// Unified developer startup: cleans occupied default ports, starts AI server, then Vite.
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

const VITE_PORT = Number(process.env.VITE_PORT || 5174)
const AI_START_PORT = Number(process.env.AI_SERVER_PORT || 8787)

async function isPortFree(port){
  return new Promise(res=>{
    const srv = createServer()
    srv.once('error', ()=>res(false))
    srv.listen(port, ()=>{srv.close(()=>res(true))})
  })
}

async function waitForPort(port, opts={timeout:10000, interval:250}) {
  const start = Date.now()
  while(Date.now()-start < opts.timeout) {
    if (!(await isPortFree(port))) return true
    await new Promise(r=>setTimeout(r, opts.interval))
  }
  return false
}

function run(cmd, args, env={}, name){
  const child = spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } })
  child.on('exit', code => {
    if (code !== 0) console.error(`[${name}] exited with code`, code)
    process.exitCode = process.exitCode || code
  })
  return child
}

async function main(){
  // 1. Start AI server first (it has its own dynamic port fallback)
  console.log('[dev-all] starting AI server...')
  const ai = run('node', ['scripts/ai/server.mjs'], {}, 'ai')
  // 2. Wait until some port in range is bound
  const aiPorts = [AI_START_PORT, AI_START_PORT+1, AI_START_PORT+2, AI_START_PORT+3, AI_START_PORT+4]
  let aiReady = false
  for (const p of aiPorts) {
    const free = await isPortFree(p)
    if (!free) { aiReady = true; console.log(`[dev-all] AI server assumed on :${p}`); break }
  }
  if (!aiReady) {
    console.log('[dev-all] waiting for AI port...')
    await new Promise(r=>setTimeout(r, 1500))
  }

  // 3. Pick Vite port: if default busy (maybe stale), try subsequent ports up to +5
  let vitePort = VITE_PORT
  for (let i=0;i<6;i++) {
    if (await isPortFree(vitePort)) break
    vitePort++
  }
  if (vitePort !== VITE_PORT) console.log(`[dev-all] original port ${VITE_PORT} busy, using ${vitePort}`)

  console.log('[dev-all] starting Vite on port', vitePort)
  const vite = run('npx', ['vite', '--port', String(vitePort)], { VITE_AI_BASE_HINT: '' }, 'vite')

  // 4. Relay exit signals
  const stop = ()=>{ ai.kill('SIGINT'); vite.kill('SIGINT'); }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

main().catch(e=>{ console.error(e); process.exit(1) })
