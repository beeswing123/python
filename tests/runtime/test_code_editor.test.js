import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Guards the two failure modes that defined Task 7:
//   1. site/assets/runtime/code-editor.js was overwritten IN PLACE by its own
//      esbuild bundle (a 20,064-line artifact that re-bundled itself on every
//      run). The source must stay hand-written ESM.
//   2. scripts/build_editor.mjs must never be able to write to its own entry
//      point — the bug that caused (1).

// jsdom's `URL` cannot resolve a relative path against a `file:` base, so
// build the paths from this file's own directory.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sourcePath = path.join(repoRoot, 'site/assets/runtime/code-editor.js')
const buildScriptPath = path.join(repoRoot, 'scripts/build_editor.mjs')

const source = readFileSync(sourcePath, 'utf8')
const buildScript = readFileSync(buildScriptPath, 'utf8')

/** Reads the path literal assigned to `const <name> = fileURLToPath(new URL('...'))`. */
function urlLiteral(name) {
  const m = buildScript.match(new RegExp(`const\\s+${name}\\s*=[^\\n]*?new URL\\(\\s*'([^']+)'`))
  return m ? m[1] : null
}

describe('code-editor.js is hand-written ESM source, not a bundle', () => {
  it('is small enough to be source', () => {
    // The clobbered artifact was 20,034 lines; the real source is ~25.
    expect(source.split('\n').length).toBeLessThan(100)
    expect(Buffer.byteLength(source)).toBeLessThan(10_000)
  })

  it('carries no esbuild dependency banners', () => {
    // esbuild prefixes every bundled module with `// node_modules/<pkg>/...`.
    expect(source).not.toContain('// node_modules/')
  })

  it('declares createEditor as a named export', () => {
    expect(source).toMatch(/export\s*\{[^}]*\bcreateEditor\b[^}]*\}/)
  })

  it('actually exports a callable createEditor', async () => {
    const mod = await import('../../site/assets/runtime/code-editor.js')
    expect(typeof mod.createEditor).toBe('function')
  })
})

describe('scripts/build_editor.mjs cannot clobber its own entry point', () => {
  it("disables esbuild's own write, which would emit next to the entry", () => {
    // esbuild's default output path for a single entry point IS the entry
    // point. Dropping `write: false` restores the clobbering build even though
    // the explicit writeFileSync below still targets OUT.
    expect(buildScript).toMatch(/write:\s*false/)
  })

  it('writes only to OUT', () => {
    const targets = [...buildScript.matchAll(/writeFileSync\(\s*([A-Za-z_$][\w$]*)/g)].map(
      (m) => m[1],
    )
    expect(targets).toEqual(['OUT'])
  })

  it('resolves OUT to the bundle, never to the entry', () => {
    const entry = urlLiteral('ENTRY')
    const out = urlLiteral('OUT')
    expect(entry).not.toBeNull()
    expect(out).not.toBeNull()
    expect(entry.split('/').pop()).toBe('code-editor.js')
    expect(out.split('/').pop()).toBe('code-editor.bundle.js')
    expect(out).not.toBe(entry)
  })
})
