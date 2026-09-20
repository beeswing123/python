// Web Worker hosting Pyodide v0.26.
//
// Protocol
//   posts  { type: 'ready' }                        once, when Pyodide is up
//   posts  { type: 'error', error }                 if Pyodide cannot load
//   recv   { type: 'run_code', code }
//   posts  { type: 'result', stdout, stderr, error } | { type: 'error', error }
//   recv   { type: 'run_ast_checks', code, checks, astRulesSource }
//          `astRulesSource` must define run_ast_check_json(check_json, code):
//          the payloads are passed as data via globals.set, never interpolated
//          into source text.
//   posts  { type: 'ast_result', passed, error }
//
// The worker is long-lived: its main-thread owner (run-code.js) creates it once,
// keeps it for the page's lifetime, and decides when to terminate it. Pyodide
// starts loading at worker start-up rather than on the first message, so the
// main thread can budget the cold start separately from execution.
//
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

ensurePyodide().then(
  () => {
    self.postMessage({ type: 'ready' })
  },
  (err) => {
    // report it now rather than letting the main thread wait out its boot budget
    self.postMessage({ type: 'error', error: String(err) })
  },
)

self.onmessage = async (e) => {
  const msg = e.data
  if (msg.type === 'run_ast_checks') {
    try {
      const py = await ensurePyodide()
      await py.runPythonAsync(msg.astRulesSource)
      // Both payloads travel as DATA through globals.set, never as source text.
      // Building the call by interpolation used to produce
      // `json.loads({"kind":"ast",...})`, i.e. a dict argument, so every ast
      // check raised TypeError and was reported as a failed check.
      py.globals.set('__ast_check_json', JSON.stringify(msg.checks))
      py.globals.set('__ast_code', msg.code)
      const resultJson = py.runPython('run_ast_check_json(__ast_check_json, __ast_code)\n')
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
