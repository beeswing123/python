// Main-thread owner of the single long-lived Pyodide worker.
//
// Exposes:
//   window.runCode(code) -> Promise<{stdout, stderr, error}>
//   window.runAstChecks({code, checks, astRulesSource}) -> Promise<{passed, error}>
//
// One worker serves the whole page. Pyodide's cold start is ~16 MB, so paying
// it per click would both blow any execution deadline and retain a fresh
// 100-300 MB interpreter per run; keeping one alive amortises both.
//
// Boot and execution get SEPARATE budgets. The 5 s execution deadline starts
// only after the worker reports `ready`, so "no execution longer than 5 s"
// means what it says rather than doubling as a cold-start deadline.

(function () {
  const BOOT_TIMEOUT_MS = 90000
  const EXEC_TIMEOUT_MS = 5000
  const BOOT_TIMEOUT_ERROR = 'TimeoutError: Pyodide failed to start within 90 seconds'
  const WORKER_URL = 'assets/runtime/pyodide-worker.js'

  let worker = null
  let bootPromise = null
  let bootSettle = null // { resolve, reject } while the worker is starting
  let bootTimer = null
  let pending = null // the one request in flight; requests are serialised
  let tail = Promise.resolve()

  function shutdown() {
    const dying = worker
    worker = null
    bootPromise = null
    bootSettle = null
    clearTimeout(bootTimer)
    bootTimer = null
    if (dying) {
      try {
        dying.terminate()
      } catch (err) {
        // Already dead; nothing to clean up.
      }
    }
  }

  // Abandon the worker and answer everyone still waiting on it. A Pyodide that
  // cannot boot, or a worker that dies or overruns mid-run, must not be reused:
  // clearing the singleton is what lets the next call start a fresh one.
  function abort(message) {
    const settle = bootSettle
    const request = pending
    pending = null
    shutdown()
    if (settle) settle.reject(new Error(message))
    if (request) {
      clearTimeout(request.timer)
      request.fail(message)
    }
  }

  function startWorker() {
    const w = new Worker(WORKER_URL)
    worker = w
    bootPromise = new Promise((resolve, reject) => {
      bootSettle = { resolve, reject }
    })
    w.onmessage = (e) => {
      const data = (e && e.data) || {}
      if (data.type === 'ready') {
        const settle = bootSettle
        if (settle) {
          bootSettle = null
          clearTimeout(bootTimer)
          bootTimer = null
          settle.resolve()
        }
        return
      }
      if (bootSettle) {
        // Anything but `ready` before boot completes is a boot failure — e.g.
        // the Pyodide CDN is unreachable. Fail now rather than waiting out the
        // budget.
        abort(data.error ? String(data.error) : 'Worker error: ' + JSON.stringify(data))
        return
      }
      if (!pending) return // No waiter: nothing to attribute this message to.
      const request = pending
      pending = null
      clearTimeout(request.timer)
      request.settle(data)
    }
    w.onerror = (e) => {
      abort('Worker error: ' + ((e && e.message) || 'unknown error'))
    }
    bootTimer = setTimeout(() => {
      abort(BOOT_TIMEOUT_ERROR)
    }, BOOT_TIMEOUT_MS)
    return bootPromise
  }

  function ensureReady() {
    return bootPromise || startWorker()
  }

  // Requests are serialised onto the one worker: a single message in flight at
  // a time, so a response can only belong to the request that is waiting.
  function send({ message, settle, fail, timeoutMessage }) {
    const run = tail.then(async () => {
      try {
        await ensureReady()
      } catch (err) {
        return fail(err && err.message ? err.message : String(err))
      }
      return new Promise((resolve) => {
        pending = {
          settle: (data) => resolve(settle(data)),
          fail: (msg) => resolve(fail(msg)),
          timer: setTimeout(() => {
            // A runaway `while True` must not poison the reused worker.
            pending = null
            shutdown()
            resolve(fail(timeoutMessage))
          }, EXEC_TIMEOUT_MS),
        }
        worker.postMessage(message)
      })
    })
    // Keep the chain alive whatever this request did.
    tail = run.then(
      () => {},
      () => {},
    )
    return run
  }

  function runResult(data) {
    if (data.type === 'result') {
      return { stdout: data.stdout || '', stderr: data.stderr || '', error: data.error || null }
    }
    if (data.type === 'error') {
      return { stdout: '', stderr: '', error: data.error || 'Worker error' }
    }
    return { stdout: '', stderr: '', error: 'Unknown worker message: ' + JSON.stringify(data) }
  }

  function runFailure(message) {
    return { stdout: '', stderr: '', error: message }
  }

  function astResult(data) {
    if (data.type === 'ast_result') {
      return { passed: !!data.passed, error: data.error || null }
    }
    return { passed: false, error: 'Unexpected worker message: ' + JSON.stringify(data) }
  }

  function astFailure(message) {
    return { passed: false, error: message }
  }

  window.runCode = function runCode(code) {
    return send({
      message: { type: 'run_code', code },
      settle: runResult,
      fail: runFailure,
      timeoutMessage: 'TimeoutError: code exceeded 5 seconds',
    })
  }

  window.runAstChecks = function runAstChecks({ code, checks, astRulesSource }) {
    return send({
      message: { type: 'run_ast_checks', code, checks, astRulesSource },
      settle: astResult,
      fail: astFailure,
      timeoutMessage: 'TimeoutError: AST check exceeded 5 seconds',
    })
  }
})()
