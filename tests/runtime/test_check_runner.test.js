import { describe, it, expect, beforeEach, vi } from 'vitest'

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
