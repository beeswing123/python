import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Guards the Task 7 vacuous-pass regression.
//
// `CheckRunner.parseFrontmatter` is a line-regex scalar parser: it cannot
// represent the nested `checks` list, so feeding its output to
// `UIControls.bind` made `runChecks` iterate a string (or nothing at all) and
// report PASS for every submission. The page must take its lesson metadata
// from the manifest entry, where `build-manifest` has already parsed the YAML.
//
// These are source-text assertions on purpose: reproducing the regression in a
// browser is the job of the real-device test, not of vitest.

// jsdom's `URL` cannot resolve a relative path against a `file:` base, so
// build the paths from this file's own directory.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const html = readFileSync(path.join(repoRoot, 'site/index.html'), 'utf8')
const manifest = JSON.parse(readFileSync(path.join(repoRoot, 'content/manifest.json'), 'utf8'))

describe('index.html takes lesson metadata from the manifest', () => {
  it('awaits LiaScriptLoader.getLesson for the lesson object', () => {
    expect(html).toMatch(/const\s+lesson\s*=\s*await\s+window\.LiaScriptLoader\.getLesson\(/)
  })

  it('binds parseFrontmatter to the Markdown body only', () => {
    expect(html).toMatch(/const\s*\{\s*body\s*\}\s*=\s*window\.CheckRunner\.parseFrontmatter\(/)
    // Binding `meta` at all is the regression: that object is scalar-only.
    expect(html).not.toMatch(/\{\s*meta\b/)
  })
})

describe('index.html passes an array of checks into UIControls.bind', () => {
  it('hands the manifest entry to UIControls.bind', () => {
    const bindCall = html.match(/window\.UIControls\.bind\(\{([\s\S]*?)\n\s*\}\)/)
    expect(bindCall).not.toBeNull()
    expect(bindCall[1]).toMatch(/lesson:\s*lesson\b/)
  })

  it('that entry carries checks as an array of check objects', () => {
    const defaultId = html.match(/params\.get\('id'\)\s*\|\|\s*'([^']+)'/)?.[1]
    expect(defaultId).toBeTruthy()
    const entry = manifest.lessons.find((lesson) => lesson.id === defaultId)
    expect(entry).toBeDefined()
    expect(Array.isArray(entry.checks)).toBe(true)
    expect(entry.checks.length).toBeGreaterThan(0)
    for (const check of entry.checks) {
      expect(typeof check.kind).toBe('string')
    }
  })
})
