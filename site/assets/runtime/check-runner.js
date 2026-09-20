// Browser-side check orchestrator.
// Exposes:
//   window.CheckRunner.runChecks(code, checks) -> Promise<{passed, errors, hints}>
//   window.CheckRunner.parseFrontmatter(md) -> {meta, body}
//
// Output checks run via window.runCode (Pyodide worker).
// AST checks run inside the same Pyodide worker, which loads
// run_ast_check from the bundled ast_rules.py.js source.

(function () {
  let astRulesSourcePromise = null
  function loadAstRulesSource() {
    if (!astRulesSourcePromise) {
      astRulesSourcePromise = fetch('/assets/runtime/ast_rules.py.js', { cache: 'force-cache' })
        .then((r) => {
          if (!r.ok) throw new Error('Failed to load ast_rules.py.js: ' + r.status)
          return r.text()
        })
    }
    return astRulesSourcePromise
  }

  async function runAstChecksInPyodide(code, checks) {
    const worker = new Worker('/assets/runtime/pyodide-worker.js')
    try {
      const astSrc = await loadAstRulesSource()
      const TIMEOUT_MS = 5000
      return await new Promise((resolve) => {
        const timer = setTimeout(() => {
          worker.terminate()
          resolve({ passed: false, error: 'TimeoutError: AST check exceeded 5 seconds' })
        }, TIMEOUT_MS)
        worker.onmessage = (e) => {
          clearTimeout(timer)
          if (e.data.type === 'ast_result') resolve(e.data)
          else resolve({ passed: false, error: 'Unexpected worker message: ' + JSON.stringify(e.data) })
        }
        worker.onerror = (e) => {
          clearTimeout(timer)
          resolve({ passed: false, error: 'Worker error: ' + e.message })
        }
        worker.postMessage({
          type: 'run_ast_checks',
          code,
          checks,
          astRulesSource: astSrc,
        })
      })
    } catch (err) {
      worker.terminate()
      return { passed: false, error: String(err) }
    }
  }

  async function runChecks(code, checks) {
    const errors = []
    const hints = []
    for (const check of checks) {
      if (check.kind === 'output') {
        const r = await window.runCode(code)
        if ((r.stdout || '') !== (check.expected || '')) {
          errors.push('Output mismatch.\nExpected: ' + JSON.stringify(check.expected) +
                      '\nGot: ' + JSON.stringify(r.stdout))
        }
      } else if (check.kind === 'ast') {
        const r = await runAstChecksInPyodide(code, check)
        if (!r.passed) errors.push(r.error || 'AST check failed')
      } else {
        errors.push('Unknown check kind: ' + check.kind)
      }
    }
    return { passed: errors.length === 0, errors, hints }
  }

  // Splits a lesson Markdown file into its frontmatter (`meta`) and `body`.
  //
  // `meta` is scalar-only and is NOT the source of lesson metadata: the
  // authoritative, fully-parsed frontmatter arrives pre-parsed in
  // `content/manifest.json` (written by `build-manifest`, read via
  // `LiaScriptLoader.getLesson`). This function now exists only to split the
  // Markdown body from its frontmatter; the page ignores `meta`.
  function parseFrontmatter(md) {
    const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!m) return { meta: {}, body: md }
    const meta = {}
    for (const line of m[1].split('\n')) {
      const mm = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
      if (mm) meta[mm[1]] = mm[2]
    }
    return { meta, body: m[2] }
  }

  window.CheckRunner = { runChecks, parseFrontmatter }
})()
