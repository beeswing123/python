import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Progress', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    delete window.Progress
  })

  it('starts empty', async () => {
    await import('../../site/assets/runtime/progress.js')
    expect(window.Progress.getDone()).toEqual([])
  })

  it('marks done and dedupes', async () => {
    await import('../../site/assets/runtime/progress.js')
    window.Progress.markDone('ch01-l01')
    window.Progress.markDone('ch01-l01')
    window.Progress.markDone('ch01-l02')
    expect(window.Progress.getDone()).toEqual(['ch01-l01', 'ch01-l02'])
  })

  it('round-trips code per lesson', async () => {
    await import('../../site/assets/runtime/progress.js')
    window.Progress.setCode('ch01-l01', 'print(1)')
    expect(window.Progress.getCode('ch01-l01')).toBe('print(1)')
  })

  it('round-trips language preference', async () => {
    await import('../../site/assets/runtime/progress.js')
    window.Progress.setLanguage('zh')
    expect(window.Progress.getLanguage()).toBe('zh')
  })
})
