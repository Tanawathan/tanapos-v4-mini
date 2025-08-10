#!/usr/bin/env node
// Kill common dev ports that may be left by zombie processes (macOS / Linux)
import { execSync } from 'node:child_process'

const PORT_RANGES = [
  [5174, 5180], // Vite dev fallback range
  [8787, 8792]  // AI server fallback range
]

function killPort(port){
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore','pipe','ignore'] }).toString().trim()
    if (!out) return
    const pids = out.split('\n').filter(Boolean)
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGKILL')
        console.log(`[kill-ports] Killed PID ${pid} on port ${port}`)
      } catch (e) {
        console.warn(`[kill-ports] Failed to kill PID ${pid} on port ${port}: ${e?.message||e}`)
      }
    }
  } catch {}
}

for (const [start,end] of PORT_RANGES) {
  for (let p=start; p<=end; p++) killPort(p)
}

console.log('[kill-ports] Cleanup complete')
