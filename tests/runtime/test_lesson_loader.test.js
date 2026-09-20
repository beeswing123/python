import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('LiaScriptLoader.fetchLesson', () => {
  beforeEach(() => {
    vi.resetModules()
    delete window.LiaScriptLoader
  })

  it('rejects when lesson id is unknown', async () => {
    await import('../../site/assets/runtime/lesson-loader.js')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ lessons: [] }),
    })
    await expect(window.LiaScriptLoader.fetchLesson('missing')).rejects.toThrow(
      'Lesson not found: missing',
    )
  })

  it('returns markdown when lesson id is found', async () => {
    await import('../../site/assets/runtime/lesson-loader.js')
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.endsWith('/content/manifest.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            lessons: [
              { id: 'ch01-l01', chapter_dir: 'ch01-getting-started', file: '01-hello.md' },
            ],
          }),
        })
      }
      if (url.endsWith('/content/ch01-getting-started/01-hello.md')) {
        return Promise.resolve({ ok: true, text: async () => '# Hello' })
      }
      return Promise.reject(new Error('unexpected url: ' + url))
    })
    const md = await window.LiaScriptLoader.fetchLesson('ch01-l01')
    expect(md).toBe('# Hello')
  })
})

describe('LiaScriptLoader.getLesson', () => {
  beforeEach(() => {
    vi.resetModules()
    delete window.LiaScriptLoader
  })

  it('returns the manifest entry with parsed metadata intact', async () => {
    await import('../../site/assets/runtime/lesson-loader.js')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        lessons: [
          {
            id: 'ch01-l01',
            chapter_dir: 'ch01-getting-started',
            file: '01-hello.md',
            title: { en: 'Hi', zh: '嗨' },
            starter_code: "print('hi')\n",
            hints: [{ en: 'Use print' }],
            checks: [{ kind: 'output', expected: 'hi\n' }],
          },
        ],
      }),
    })

    const lesson = await window.LiaScriptLoader.getLesson('ch01-l01')
    expect(lesson.id).toBe('ch01-l01')
    expect(lesson.title).toEqual({ en: 'Hi', zh: '嗨' })
    expect(lesson.starter_code).toBe("print('hi')\n")
    // The whole point: checks arrive as a real array of objects, not a string.
    expect(Array.isArray(lesson.checks)).toBe(true)
    expect(lesson.checks[0].kind).toBe('output')
    await expect(window.LiaScriptLoader.getLesson('missing')).rejects.toThrow(
      'Lesson not found: missing',
    )
  })
})