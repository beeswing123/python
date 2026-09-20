// Main-thread helper: spawns a fresh Pyodide worker per call, with a 5s hard timeout.
// Exposes window.runCode(code) -> Promise<{stdout, stderr, error}>.

(function () {
  const TIMEOUT_MS = 5000

  function runOnce(worker, code) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        worker.terminate()
        resolve({ stdout: '', stderr: '', error: 'TimeoutError: code exceeded 5 seconds' })
      }, TIMEOUT_MS)
      worker.onmessage = (e) => {
        clearTimeout(timer)
        if (e.data.type === 'result') resolve(e.data)
        else if (e.data.type === 'error') resolve({ stdout: '', stderr: '', error: e.data.error })
        else resolve({ stdout: '', stderr: '', error: 'Unknown worker message: ' + JSON.stringify(e.data) })
      }
      worker.onerror = (e) => {
        clearTimeout(timer)
        resolve({ stdout: '', stderr: '', error: 'Worker error: ' + e.message })
      }
      worker.postMessage({ type: 'run_code', code })
    })
  }

  window.runCode = function runCode(code) {
    const worker = new Worker('/assets/runtime/pyodide-worker.js')
    return runOnce(worker, code)
  }
})()
