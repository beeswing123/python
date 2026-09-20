import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Guards the two failure modes that defined Task 7:
//   1. site/assets/runtime/code-editor.js was overwritten IN PLACE by its own
//      esbuild bundle (a ~20,000-line artifact that re-bundled itself on every
//      run). The source must stay hand-written ESM.
//   2. scripts/build_editor.mjs must never write to its own entry point. The
//      old script did so with an explicit in-place `writeFileSync` — no
//      esbuild default was responsible — so the guards below pin the script's
//      write target and the ENTRY/OUT distinction.

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
  it('has not been replaced by a generated artifact', () => {
    // Deliberately loose: the real source is ~25 lines and the clobbered
    // artifact was 20,034, so this only trips on a wholesale replacement.
    // The dependency-banner check below is the precise "is this a bundle?"
    // test — do not tighten this cap, the editor is expected to grow.
    expect(source.split('\n').length).toBeLessThan(5_000)
  })

  it('carries no esbuild dependency banners', () => {
    // esbuild prefixes every bundled module with `// node_modules/<pkg>/...`;
    // the committed bundle has 13 of them.
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
  it('reads the output in memory instead of letting esbuild emit it', () => {
    // `write: false` makes esbuild return the bundle in `result.outputFiles`
    // and emit nothing; the script's only write is therefore its own explicit
    // `writeFileSync(OUT, ...)` below. Dropping it does not clobber the entry
    // (esbuild writes to stdout and leaves `outputFiles` undefined, so the
    // build fails loudly at that writeFileSync) — checked against esbuild
    // 0.28.2. What actually keeps the entry safe is the pair of assertions
    // that follow: OUT is the only write target, and OUT is not ENTRY.
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
