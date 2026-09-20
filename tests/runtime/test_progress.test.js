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

  it('rejects a bad import file, normalising one that is only wrong-shaped', async () => {
    await import('../../site/assets/runtime/progress.js')

    const badVersion = new File([JSON.stringify({ version: 2 })], 'bad.json', { type: 'application/json' })
    await expect(window.Progress.importJSON(badVersion)).rejects.toThrow(
      'Unsupported progress version: 2',
    )
    expect(window.Progress.getDone()).toEqual([])

    // `{"version": 1}` is a valid version but has none of the expected fields.
    // It must be repaired, not persisted, or every later pass would throw.
    const sparse = new File([JSON.stringify({ version: 1 })], 'sparse.json', { type: 'application/json' })
    await window.Progress.importJSON(sparse)
    expect(window.Progress.getDone()).toEqual([])
    expect(window.Progress.getLanguage()).toBe('en')
    expect(window.Progress.getCode('missing')).toBe('')
    expect(() => window.Progress.markDone('ch01-l01')).not.toThrow()
    expect(window.Progress.getDone()).toEqual(['ch01-l01'])
  })

  it('self-heals corrupt or wrong-shaped stored state', async () => {
    await import('../../site/assets/runtime/progress.js')

    localStorage.setItem('py-tutorial:v1', 'not json')
    expect(window.Progress.getDone()).toEqual([])
    expect(() => window.Progress.markDone('ch01-l01')).not.toThrow()

    localStorage.setItem('py-tutorial:v1', JSON.stringify({ version: 1 }))
    expect(window.Progress.getDone()).toEqual([])
    expect(() => window.Progress.markDone('ch01-l02')).not.toThrow()
    expect(window.Progress.getDone()).toEqual(['ch01-l02'])

    localStorage.setItem('py-tutorial:v1', JSON.stringify({ version: 99, done: ['x'] }))
    expect(window.Progress.getDone()).toEqual([])
  })

  it('round-trips the current lesson', async () => {
    await import('../../site/assets/runtime/progress.js')
    expect(window.Progress.getCurrent()).toBeNull()
    window.Progress.setCurrent('ch01-l01')
    expect(window.Progress.getCurrent()).toBe('ch01-l01')
  })

  it('exportJSON emits a blob holding the stored state', async () => {
    await import('../../site/assets/runtime/progress.js')
    window.Progress.markDone('ch01-l01')
    window.Progress.setCode('ch01-l01', 'print(1)')

    let captured = null
    let downloaded = null
    const origCreate = window.URL.createObjectURL
    const origRevoke = window.URL.revokeObjectURL
    const origClick = window.HTMLAnchorElement.prototype.click
    window.URL.createObjectURL = (blob) => { captured = blob; return 'blob:test' }
    window.URL.revokeObjectURL = () => {}
    window.HTMLAnchorElement.prototype.click = function () { downloaded = this.download }
    try {
      window.Progress.exportJSON()
    } finally {
      window.URL.createObjectURL = origCreate
      window.URL.revokeObjectURL = origRevoke
      window.HTMLAnchorElement.prototype.click = origClick
    }

    expect(captured).toBeInstanceOf(window.Blob)
    expect(captured.type).toBe('application/json')
    expect(downloaded).toBe('py-tutorial-progress.json')

    const parsed = JSON.parse(await captured.text())
    expect(parsed.version).toBe(1)
    expect(parsed.done).toEqual(['ch01-l01'])
    expect(parsed.code['ch01-l01']).toBe('print(1)')
  })
})
