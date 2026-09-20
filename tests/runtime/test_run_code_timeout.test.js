import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The worker contract has two budgets: a generous BOOT budget while Pyodide
// starts (~16 MB of wasm) and the 5 s EXECUTION budget, which begins only once
// the worker reports `ready`. The single-deadline version made a cold start
// indistinguishable from `while True: pass`. These tests pin both branches, the
// retry after a boot failure, and the success path where the worker must stay
// alive — the branch whose absence hid the interpreter leak.

/** Installs a fake Worker that records its instances and can be driven by hand. */
function installWorker() {
  const workers = []
  window.Worker = class {
    constructor(url) {
      this.url = url
      this.terminated = false
      this.posted = []
      this.onmessage = null
      this.onerror = null
      workers.push(this)
    }

    postMessage(msg) {
      this.posted.push(msg)
    }

    terminate() {
      this.terminated = true
    }

    /** Delivers a message the way the real worker would. */
    emit(data) {
      this.onmessage({ data })
    }
  }
  return workers
}

describe('runCode budgets', () => {
  let workers

  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
    delete window.runCode
    delete window.runAstChecks
    workers = installWorker()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not fail at 5 s while Pyodide is still booting', async () => {
    await import('../../site/assets/runtime/run-code.js')
    const promise = window.runCode('print(1)')
    let settled = false
    promise.then(() => {
      settled = true
    })

    // The old, single 5 s deadline covered the cold start too, so this is the
    // exact moment a cold cache used to produce a bogus TimeoutError.
    await vi.advanceTimersByTimeAsync(5001)
    expect(settled).toBe(false)
    expect(workers).toHaveLength(1)
    expect(workers[0].terminated).toBe(false)
  })

  it('reports a Pyodide start-up timeout when the worker never becomes ready', async () => {
    await import('../../site/assets/runtime/run-code.js')
    const promise = window.runCode('print(1)')

    await vi.advanceTimersByTimeAsync(90_001)
    const result = await promise

    // Distinct from the execution-timeout string, so a slow boot can never be
    // mistaken for a runaway program.
    expect(result.error).toBe('TimeoutError: Pyodide failed to start within 90 seconds')
    expect(workers).toHaveLength(1)
    expect(workers[0].terminated).toBe(true)
    expect(workers[0].posted).toEqual([]) // nothing was ever executed
  })

  it('clears the singleton after a boot timeout so the next call retries', async () => {
    await import('../../site/assets/runtime/run-code.js')
    const first = window.runCode('print(1)')
    await vi.advanceTimersByTimeAsync(90_001)
    await first

    window.runCode('print(2)')
    await vi.advanceTimersByTimeAsync(0)

    expect(workers).toHaveLength(2)
  })

  it('enforces 5 s on execution once the worker is ready, then terminates it', async () => {
    await import('../../site/assets/runtime/run-code.js')
    const promise = window.runCode('while True: pass')
    await vi.advanceTimersByTimeAsync(0)

    expect(workers).toHaveLength(1)
    workers[0].emit({ type: 'ready' })
    await vi.advanceTimersByTimeAsync(0)
    expect(workers[0].posted).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(5001)
    const result = await promise

    expect(result.error).toBe('TimeoutError: code exceeded 5 seconds')
    expect(workers[0].terminated).toBe(true)
  })

  it('keeps the worker alive and reuses it on success', async () => {
    await import('../../site/assets/runtime/run-code.js')
    const first = window.runCode("print('hi')")
    await vi.advanceTimersByTimeAsync(0)
    workers[0].emit({ type: 'ready' })
    await vi.advanceTimersByTimeAsync(0)

    workers[0].emit({ type: 'result', stdout: 'hi\n', stderr: '', error: null })
    expect(await first).toEqual({ stdout: 'hi\n', stderr: '', error: null })
    expect(workers[0].terminated).toBe(false)

    const second = window.runCode("print('again')")
    await vi.advanceTimersByTimeAsync(0)
    // One interpreter for the page's lifetime: no second worker, no leak.
    expect(workers).toHaveLength(1)
    workers[0].emit({ type: 'result', stdout: 'again\n', stderr: '', error: null })
    expect(await second).toEqual({ stdout: 'again\n', stderr: '', error: null })
  })

  it('reports a worker error rather than hanging', async () => {
    await import('../../site/assets/runtime/run-code.js')
    const promise = window.runCode('print(1)')
    await vi.advanceTimersByTimeAsync(0)

    workers[0].emit({ type: 'error', error: 'boom' })
    expect(await promise).toEqual({ stdout: '', stderr: '', error: 'boom' })
  })
})

describe('runAstChecks', () => {
  let workers

  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
    delete window.runCode
    delete window.runAstChecks
    workers = installWorker()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('posts to the same already-booted worker as runCode', async () => {
    await import('../../site/assets/runtime/run-code.js')
    const run = window.runCode('print(1)')
    await vi.advanceTimersByTimeAsync(0)
    workers[0].emit({ type: 'ready' })
    await vi.advanceTimersByTimeAsync(0)
    workers[0].emit({ type: 'result', stdout: '', stderr: '', error: null })
    await run

    const ast = window.runAstChecks({
      code: 'print(1)',
      checks: { kind: 'ast', must_contain_call: 'print' },
      astRulesSource: '# python',
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(workers).toHaveLength(1)
    expect(workers[0].posted[1]).toMatchObject({ type: 'run_ast_checks' })
    workers[0].emit({ type: 'ast_result', passed: false, error: 'Expected call not found' })
    expect(await ast).toEqual({ passed: false, error: 'Expected call not found' })
  })
})
