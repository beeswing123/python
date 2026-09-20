// Browser-side check orchestrator.
// Exposes:
//   window.CheckRunner.runChecks(code, checks) -> Promise<{passed, errors, hints}>
//   window.CheckRunner.parseFrontmatter(md) -> {meta, body}
//
// Output checks run via window.runCode (Pyodide worker).
// AST checks go through window.runAstChecks, which posts to the same
// long-lived worker rather than starting a second interpreter; the worker
// loads run_ast_check from the bundled ast_rules.py.js source.

(function () {
  let astRulesSourcePromise = null
  function loadAstRulesSource() {
    if (!astRulesSourcePromise) {
      astRulesSourcePromise = fetch('assets/runtime/ast_rules.py.js', { cache: 'force-cache' })
        .then((r) => {
          if (!r.ok) throw new Error('Failed to load ast_rules.py.js: ' + r.status)
          return r.text()
        })
        .catch((err) => {
          // Same rule as the manifest: never memoise a rejection, or one
          // transient failure disables every AST check until a reload.
          astRulesSourcePromise = null
          throw err
        })
    }
    return astRulesSourcePromise
  }

  // Delegates to the shared worker: the AST rules are evaluated in the Pyodide
  // instance the page already has, not in a second one.
  async function runAstChecks(code, check) {
    try {
      const astRulesSource = await loadAstRulesSource()
      // `checks` carries the single check object straight through to
      // run_ast_check() in the worker.
      return await window.runAstChecks({ code, checks: check, astRulesSource })
    } catch (err) {
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
        const r = await runAstChecks(code, check)
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
