// Web Worker hosting Pyodide v0.26.
// Receives: { type: 'run_code', code: string }
// Posts:    { type: 'result', stdout, stderr, error } | { type: 'error', error }
// Receives: { type: 'run_ast_checks', code, checks, astRulesSource }
// Posts:    { type: 'ast_result', passed, error }
// Note: importScripts is CORS-friendly for cross-origin scripts in workers;
// Pyodide's CDN serves with permissive CORS headers.

const PYODIDE_VERSION = 'v0.26.2'
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/' + PYODIDE_VERSION + '/full/'

let pyodide = null
let loadingPromise = null

function ensurePyodide() {
  if (pyodide) return Promise.resolve(pyodide)
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    importScripts(PYODIDE_BASE + 'pyodide.js')
    pyodide = await self.loadPyodide({ indexURL: PYODIDE_BASE })
    return pyodide
  })()
  return loadingPromise
}

self.onmessage = async (e) => {
  const msg = e.data
  if (msg.type === 'run_ast_checks') {
    try {
      const py = await ensurePyodide()
      await py.runPythonAsync(msg.astRulesSource)
      const checkJson = JSON.stringify(msg.checks)
      const codeJson = JSON.stringify(msg.code)
      const resultJson = py.runPython(
        'import json\n' +
        'check = json.loads(' + checkJson + ')\n' +
        'code = json.loads(' + codeJson + ')\n' +
        'passed, err = run_ast_check(code, check)\n' +
        'json.dumps({"passed": passed, "error": err})\n'
      )
      const parsed = JSON.parse(resultJson)
      self.postMessage({ type: 'ast_result', passed: parsed.passed, error: parsed.error })
    } catch (err) {
      self.postMessage({ type: 'ast_result', passed: false, error: String(err) })
    }
    return
  }
  if (msg.type !== 'run_code') return
  try {
    const py = await ensurePyodide()
    let stdout = ''
    let stderr = ''
    py.setStdout({ batched: (s) => { stdout += s + '\n' } })
    py.setStderr({ batched: (s) => { stderr += s + '\n' } })
    let error = null
    try {
      await py.runPythonAsync(msg.code)
    } catch (err) {
      error = String(err)
    }
    self.postMessage({ type: 'result', stdout, stderr, error })
  } catch (err) {
    self.postMessage({ type: 'error', error: String(err) })
  }
}
