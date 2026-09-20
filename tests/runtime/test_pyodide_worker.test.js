import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// The worker built its AST-check Python source by pasting JSON into it:
//
//   'check = json.loads(' + checkJson + ')\n'
//
// `checkJson` is the JSON text of an OBJECT literal, so Python received
// json.loads({"kind":"ast",...}) and raised
// "TypeError: the JSON object must be str, bytes or bytearray, not dict".
// The worker's catch reported that as `passed: false`, so EVERY ast check
// failed at runtime — including the only shipped lesson's — and
// "✓ All checks passed!" was unreachable.
//
// This is a SOURCE-TEXT guard: it pins the MECHANISM (payloads travel as data
// through globals.set, never as source text) and cannot execute Python. The
// execution coverage is tests/test_ast_rules.py, which runs run_ast_check_json
// directly in plain pytest.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const workerPath = path.join(repoRoot, 'site/assets/runtime/pyodide-worker.js')

/** Full-line `//` comments removed, so commented-out code cannot trip a check. */
function workerCode() {
  return readFileSync(workerPath, 'utf8')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
}

describe('pyodide-worker.js passes AST payloads as data, not as source text', () => {
  it('sets both payloads through globals.set', () => {
    const code = workerCode()
    expect(code).toMatch(/\.globals\.set\(\s*'__ast_check_json'\s*,\s*JSON\.stringify\(/)
    expect(code).toMatch(/\.globals\.set\(\s*'__ast_code'\s*,\s*msg\.code\s*\)/)
  })

  it('runs the entry point defined in ast_rules.py', () => {
    expect(workerCode()).toMatch(/run_ast_check_json\(__ast_check_json,\s*__ast_code\)/)
  })

  it('never builds a json.loads() call out of a JSON string', () => {
    const code = workerCode()
    // The exact broken shape: an opening quote, then concatenation.
    expect(code).not.toMatch(/json\.loads\(\s*'\s*\+/)
    // Structurally: the worker writes no JSON parsing into Python at all.
    expect(code).not.toContain('json.loads(')
  })

  it('passes no concatenated expression to runPython/runPythonAsync', () => {
    // String building in the source it executes is the class of bug; the
    // remaining calls are a single literal and a variable, neither of which
    // can splice a payload into Python syntax.
    const calls = workerCode().match(/\.runPython(?:Async)?\([^\n]*/g) || []
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call).not.toContain('+')
    }
  })

  it('the committed ast_rules.py.js artifact defines the entry point it calls', () => {
    // Cross-file: updating the worker without regenerating the artifact would
    // otherwise only surface in a browser.
    const artifact = readFileSync(
      path.join(repoRoot, 'site/assets/runtime/ast_rules.py.js'),
      'utf8',
    )
    expect(artifact).toContain('def run_ast_check_json(')
  })
})
