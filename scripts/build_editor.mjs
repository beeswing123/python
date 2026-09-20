// Bundle site/assets/runtime/code-editor.js -> code-editor.bundle.js with esbuild.
//
// CodeMirror 6 is ESM-only with bare specifiers ("@codemirror/state", etc.);
// browsers cannot resolve those from a <script type="module">, so the entry
// point must be bundled. The bundle is written to a SEPARATE file and is
// committed, so site/ stays servable by a plain static server. The entry
// point itself is never written to by this script.
//
// Run by hand (or by CI) whenever code-editor.js source changes:
//   npm run build:editor

import { build } from 'esbuild'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ENTRY = fileURLToPath(new URL('../site/assets/runtime/code-editor.js', import.meta.url))
const OUT = fileURLToPath(new URL('../site/assets/runtime/code-editor.bundle.js', import.meta.url))

const result = await build({
  entryPoints: [ENTRY],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  legalComments: 'none',
  write: false,
})

writeFileSync(OUT, result.outputFiles[0].text)
console.log('bundled', ENTRY, '->', OUT)
