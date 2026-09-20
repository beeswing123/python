import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('runCode timeout', () => {
  beforeEach(() => {
    delete window.runCode
    delete window.Worker
  })

  it('returns timeout error when worker does not respond within 5s', async () => {
    vi.useFakeTimers()
    const workers = []
    class FakeWorker {
      constructor() {
        this.terminated = false
        workers.push(this)
      }
      postMessage() {}
      terminate() { this.terminated = true }
    }
    window.Worker = FakeWorker

    await import('../../site/assets/runtime/run-code.js')
    const promise = window.runCode('while True: pass')
    await vi.advanceTimersByTimeAsync(5001)
    const result = await promise
    expect(result.error).toMatch(/TimeoutError/)
    expect(workers[0].terminated).toBe(true)
    vi.useRealTimers()
  })
})
