import { describe, it, expect, beforeEach, vi } from 'vitest'

// runChecks is the function that decides pass/fail, and until now nothing
// tested it: the only coverage was parseFrontmatter, which after the Task 7
// ruling plays no part in the data path. Both collaborators are stubbed, so
// these pin the orchestration rather than Pyodide.
describe('CheckRunner.runChecks', () => {
  let runCode
  let runAstChecks

  beforeEach(async () => {
    vi.resetModules()
    delete window.CheckRunner
    delete window.runCode
    delete window.runAstChecks
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => '# ast rules' })
    await import('../../site/assets/runtime/check-runner.js')
    runCode = vi.fn()
    runAstChecks = vi.fn()
    window.runCode = runCode
    window.runAstChecks = runAstChecks
  })

  /** Every return path must have the shape §3.3 specifies. */
  function expectResultShape(result) {
    expect(Object.keys(result).sort()).toEqual(['errors', 'hints', 'passed'])
    expect(typeof result.passed).toBe('boolean')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.hints)).toBe(true)
  }

  it('passes an output check whose stdout matches exactly', async () => {
    runCode.mockResolvedValue({ stdout: 'Hello, World!\n', stderr: '', error: null })

    const result = await window.CheckRunner.runChecks('print("Hello, World!")', [
      { kind: 'output', expected: 'Hello, World!\n' },
    ])

    expect(result).toEqual({ passed: true, errors: [], hints: [] })
    expectResultShape(result)
  })

  it('fails a mismatched output check, naming expected and actual', async () => {
    runCode.mockResolvedValue({ stdout: 'nope\n', stderr: '', error: null })

    const result = await window.CheckRunner.runChecks('print("nope")', [
      { kind: 'output', expected: 'Hello, World!\n' },
    ])

    expect(result.passed).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/Expected: "Hello, World!\\n"/)
    expect(result.errors[0]).toMatch(/Got: "nope\\n"/)
    expectResultShape(result)
  })

  it('delegates an ast check to runAstChecks and surfaces its failure', async () => {
    const check = { kind: 'ast', must_contain_call: 'print' }
    runAstChecks.mockResolvedValue({
      passed: false,
      error: "Expected call to 'print()' not found",
    })

    const result = await window.CheckRunner.runChecks('x = 1', [check])

    // The AST rule goes to the shared Pyodide worker, not a private one.
    expect(runAstChecks).toHaveBeenCalledTimes(1)
    expect(runAstChecks.mock.calls[0][0]).toMatchObject({ code: 'x = 1', checks: check })
    expect(runCode).not.toHaveBeenCalled()
    expect(result.passed).toBe(false)
    expect(result.errors).toEqual(["Expected call to 'print()' not found"])
    expectResultShape(result)
  })

  it('passes when runAstChecks reports success', async () => {
    runAstChecks.mockResolvedValue({ passed: true, error: null })

    const result = await window.CheckRunner.runChecks('print(1)', [
      { kind: 'ast', must_contain_call: 'print' },
    ])

    expect(result).toEqual({ passed: true, errors: [], hints: [] })
  })

  it('reports an unknown check kind as an error', async () => {
    const result = await window.CheckRunner.runChecks('x = 1', [{ kind: 'quiz' }])

    expect(result.passed).toBe(false)
    expect(result.errors).toEqual(['Unknown check kind: quiz'])
    expectResultShape(result)
  })

  it('accumulates every failing check rather than stopping at the first', async () => {
    runCode.mockResolvedValue({ stdout: 'a\n', stderr: '', error: null })
    runAstChecks.mockResolvedValue({ passed: false, error: 'no print call' })

    const result = await window.CheckRunner.runChecks('x = 1', [
      { kind: 'output', expected: 'b\n' },
      { kind: 'ast', must_contain_call: 'print' },
      { kind: 'nonsense' },
    ])

    expect(result.passed).toBe(false)
    expect(result.errors).toHaveLength(3)
    expectResultShape(result)
  })
})

describe('CheckRunner.parseFrontmatter', () => {
  beforeEach(() => {
    vi.resetModules()
    delete window.CheckRunner
  })

  it('parses simple yaml frontmatter', async () => {
    await import('../../site/assets/runtime/check-runner.js')
    const md = '---\nid: ch01-l01\ntitle: Hello\n---\n# Body'
    const { meta, body } = window.CheckRunner.parseFrontmatter(md)
    expect(meta.id).toBe('ch01-l01')
    expect(meta.title).toBe('Hello')
    expect(body).toContain('# Body')
  })

  it('returns empty meta when no frontmatter', async () => {
    await import('../../site/assets/runtime/check-runner.js')
    const { meta, body } = window.CheckRunner.parseFrontmatter('# Just a heading')
    expect(meta).toEqual({})
    expect(body).toContain('# Just a heading')
  })
})
