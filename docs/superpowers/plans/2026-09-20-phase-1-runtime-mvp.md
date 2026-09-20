# Phase 1 Runtime MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an end-to-end interactive Python lesson in the browser, deployed to GitHub Pages, with code execution (Pyodide), automatic checks (output + AST), Hint/Show Answer reveal, localStorage progress, and JSON import/export.

**Architecture:** Static site on GitHub Pages. LiaScript runtime loaded from CDN renders Markdown lessons. A Web Worker hosts Pyodide for safe code execution with a 5-second hard timeout. A check runner runs `output` and `ast` checks inside Pyodide (re-using the Python `ast_rules.py` validator). localStorage stores progress; a JSON file moves progress between devices.

**Tech Stack:** Python 3.12+ / `uv` (build tooling + content tests) · LiaScript (CDN runtime viewer) · Pyodide v0.26 (Web Worker, in-browser Python) · CodeMirror 6 (in-page editor) · `jsonschema` + `pyyaml` (lesson validation) · `pytest` + `vitest` (Python and JS tests) · GitHub Actions (CI + Pages deploy).

**Spec:** `docs/superpowers/specs/2026-09-20-python-interactive-tutorial-design.md`

---

## Global Constraints

Copied verbatim from the spec; every task implicitly includes these.

- Working directory: `/Users/zaili/Desktop/ai/python`
- Python: 3.12+ via `uv` (no `pip` directly, no Poetry)
- Linting: `ruff check .` and `ruff format --check .` must be clean
- Type-checking: `mypy src tests` must be clean
- Testing: `pytest` for Python (≥80% coverage on `src/`); `vitest` for JS runtime
- Python code under `src/py_tutorial_build/`; tests under `tests/`
- Lesson content under `content/`; runtime JS under `site/assets/runtime/`
- Course scope: intermediate apps, 50–80 lessons target. Phase 1 ships **1 lesson**.
- Language: English-primary, Chinese-secondary. Bilingual YAML fields everywhere (`title.en` / `title.zh`).
- Mobile target: Safari iOS 16.4+ and Chrome Android 90+. CodeMirror `font-size: 16px`.
- Hard rule: **no Python execution >5 seconds** (enforced by Pyodide worker timeout).
- All git commits use Conventional Commits format.
- Pyodide loads lazily on first lesson entry (mobile memory budget).
- No external network calls at runtime except the LiaScript and Pyodide CDNs.

---

## File Structure

Files created or modified by this plan. Each task lists the deltas; this section is the map.

```
python/
├── pyproject.toml                          # Task 1
├── uv.lock                                 # Task 1 (generated)
├── .gitignore                              # Task 1
├── README.md                               # Task 1
├── package.json                            # Task 4
├── package-lock.json                       # Task 4 (generated)
├── vitest.config.js                        # Task 4
├── src/py_tutorial_build/
│   ├── __init__.py                         # Task 1
│   ├── ast_rules.py                        # Task 6
│   ├── build_manifest.py                   # Task 9
│   ├── lesson_schema.py                    # Task 10
│   └── schemas/lesson.schema.json          # Task 10
├── tests/
│   ├── __init__.py                         # Task 1
│   ├── test_smoke.py                       # Task 1
│   ├── test_ast_rules.py                   # Task 6
│   ├── test_build_manifest.py              # Task 9
│   ├── test_lesson_schema.py               # Task 10
│   └── runtime/
│       ├── test_lesson_loader.test.js      # Task 4
│       ├── test_run_code_timeout.test.js   # Task 5
│       ├── test_check_runner.test.js       # Task 6
│       └── test_progress.test.js           # Task 8
├── .github/workflows/
│   ├── ci.yml                              # Task 2 (extended in Task 11)
│   └── deploy.yml                          # Task 3 (extended in Task 11)
├── site/
│   ├── README.md                           # Task 3
│   ├── index.html                          # Task 3 (rewritten Tasks 4, 7, 8)
│   └── assets/
│       ├── runtime/
│       │   ├── lesson-loader.js            # Task 4
│       │   ├── pyodide-worker.js           # Task 5
│       │   ├── run-code.js                 # Task 5
│       │   ├── check-runner.js             # Task 6
│       │   ├── code-editor.js              # Task 7
│       │   ├── ui-controls.js              # Task 7
│       │   ├── progress.js                 # Task 8
│       │   └── ast_rules.py.js             # Task 6 (Pyodide-side bundle of ast_rules.py)
│       └── styles/
│           ├── theme.css                   # Task 4
│           └── mobile.css                  # Task 4
├── content/
│   ├── manifest.json                       # Task 4 (placeholder), Task 9 (real)
│   └── ch01-getting-started/
│       └── 01-hello.md                     # Task 4 (stub), Task 9 (real)
└── docs/superpowers/
    ├── specs/2026-09-20-python-interactive-tutorial-design.md
    └── plans/2026-09-20-phase-1-runtime-mvp.md
```

---

## Task 1: Repository skeleton + Python project

**Files:**
- Create: `pyproject.toml`
- Create: `.gitignore`
- Create: `README.md`
- Create: `src/py_tutorial_build/__init__.py`
- Create: `tests/__init__.py`
- Create: `tests/test_smoke.py`

**Interfaces:**
- Produces: installable Python package `py_tutorial-build` with deps `jsonschema`, `pyyaml`, dev deps `pytest`, `pytest-cov`, `ruff`, `mypy`, `types-pyyaml`
- Produces: console script `build-manifest = py_tutorial_build.build_manifest:main`

- [ ] **Step 1.1: Initialize uv project**

```bash
cd /Users/zaili/Desktop/ai/python
uv init --package py_tutorial_build --python 3.12
```

Expected: `pyproject.toml`, `src/py_tutorial_build/__init__.py`, `README.md`, `.gitignore`, `hello.py` (delete later if present), `tests/test_hello.py` (delete later if present).

- [ ] **Step 1.2: Replace `pyproject.toml`**

Replace the auto-generated `pyproject.toml` with:

```toml
[project]
name = "py-tutorial-build"
version = "0.1.0"
description = "Build tooling for the Python interactive tutorial site"
requires-python = ">=3.12"
dependencies = [
    "jsonschema>=4.21",
    "pyyaml>=6.0",
]

[project.scripts]
build-manifest = "py_tutorial_build.build_manifest:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/py_tutorial_build"]

[dependency-groups]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "ruff>=0.6",
    "mypy>=1.10",
    "types-pyyaml>=6.0",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "UP", "B", "SIM"]

[tool.mypy]
python_version = "3.12"
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--strict-markers"
```

- [ ] **Step 1.3: Delete auto-generated scaffold files if present**

```bash
rm -f hello.py src/py_tutorial_build/hello.py tests/test_hello.py
```

- [ ] **Step 1.4: Create empty `tests/__init__.py`**

```bash
touch tests/__init__.py
```

- [ ] **Step 1.5: Write smoke test**

Create `tests/test_smoke.py`:

```python
def test_py_tutorial_build_imports() -> None:
    import py_tutorial_build
    assert py_tutorial_build.__name__ == "py_tutorial_build"
```

- [ ] **Step 1.6: Sync and run**

```bash
uv sync --all-extras
uv run pytest tests/test_smoke.py -v
```

Expected: 1 passed.

- [ ] **Step 1.7: Write `.gitignore` (overwrite uv-generated)**

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
.Python
.venv/
.uv-cache/

# Testing
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/

# Node (added in Task 4)
node_modules/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
```

- [ ] **Step 1.8: Replace `README.md`**

```markdown
# Python Interactive Tutorial

A browser-based interactive Python tutorial — Markdown lessons, in-browser
Python via Pyodide, deployed to GitHub Pages, mobile-friendly.

- **Live site:** https://<user>.github.io/python/
- **Spec:** `docs/superpowers/specs/2026-09-20-python-interactive-tutorial-design.md`
- **Lesson content:** `content/`
- **Build tooling:** `src/py_tutorial_build/`

## Local development

```bash
uv sync --all-extras
uv run pytest                       # content + unit tests
uv run python -m http.server        # serve site/ on http://localhost:8000
npx vitest run                      # JS runtime tests
```

## Authoring a lesson

See `content/ch01-getting-started/01-hello.md` for the full schema.
```

- [ ] **Step 1.9: Run lint + type-check**

```bash
uv run ruff check .
uv run ruff format --check .
uv run mypy src tests
```

Expected: all clean.

- [ ] **Step 1.10: Commit**

```bash
git add pyproject.toml uv.lock src/ tests/ .gitignore README.md
git commit -m "chore(scaffold): initialize uv project for build tooling"
```

---

## Task 2: CI workflow (Python tests + lint)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: GitHub Actions job `test` running on push/PR, runs `uv sync`, `ruff`, `mypy`, `pytest`

- [ ] **Step 2.1: Write CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
      - name: Sync deps
        run: uv sync --all-extras
      - name: Ruff lint
        run: uv run ruff check .
      - name: Ruff format check
        run: uv run ruff format --check .
      - name: Mypy
        run: uv run mypy src tests
      - name: Pytest
        run: uv run pytest --cov=src --cov-fail-under=80
```

- [ ] **Step 2.2: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: ruff + mypy + pytest pipeline on push and PR"
git push
```

Expected: GitHub Actions green within ~1 minute.

---

## Task 3: GitHub Pages deploy + empty index.html

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `site/index.html`
- Create: `site/README.md`

**Interfaces:**
- Produces: GitHub Actions Pages deploy workflow that publishes `site/` to GitHub Pages
- Produces: visible placeholder page at `https://<user>.github.io/python/`

- [ ] **Step 3.1: Write deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3.2: Write empty `site/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Python Interactive Tutorial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 2rem; }
  </style>
</head>
<body>
  <h1>Python Interactive Tutorial</h1>
  <p>Coming soon.</p>
</body>
</html>
```

- [ ] **Step 3.3: Write `site/README.md`**

```markdown
# `site/` — Static site for GitHub Pages

This directory is published by `.github/workflows/deploy.yml`.

- `index.html` — Course home and lesson viewer
- `assets/runtime/` — Runtime JavaScript (lesson loader, Pyodide worker, check runner, progress)
- `assets/styles/` — Theme + mobile responsive CSS
```

- [ ] **Step 3.4: Verify locally**

```bash
cd site && uv run python -m http.server 8000
```

Open `http://localhost:8000` in a browser.
Expected: see "Python Interactive Tutorial / Coming soon."
Stop the server (Ctrl-C) when done.

- [ ] **Step 3.5: Commit + push + verify Pages**

```bash
git add .github/workflows/deploy.yml site/index.html site/README.md
git commit -m "feat(site): empty index.html + GitHub Pages deploy workflow"
git push
```

Expected: GitHub Actions deploy job succeeds; the page is reachable at `https://<user>.github.io/python/` within ~1 minute.

---

## Task 4: LiaScript CDN + lesson loader + stub lesson

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `site/assets/runtime/lesson-loader.js`
- Create: `tests/runtime/test_lesson_loader.test.js`
- Create: `site/assets/styles/theme.css`
- Create: `site/assets/styles/mobile.css`
- Create: `content/ch01-getting-started/01-hello.md` (stub)
- Create: `content/manifest.json` (placeholder)
- Modify: `site/index.html` (replace body to render via LiaScript loader)

**Interfaces:**
- Produces: `window.LiaScriptLoader.fetchLesson(id: string) → Promise<string>` that returns raw Markdown (frontmatter + body) for the requested lesson id
- Produces: `index.html` that renders the lesson whose id is in `?id=` query param (default `ch01-l01-hello`)

- [ ] **Step 4.1: Initialize npm package**

```bash
cd /Users/zaili/Desktop/ai/python
npm init -y
npm install --save-dev vitest jsdom
```

Expected: `package.json` and `package-lock.json` created.

- [ ] **Step 4.2: Add npm scripts to `package.json`**

Edit `package.json` to set `"scripts"`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4.3: Configure vitest**

Create `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/runtime/**/*.test.js'],
  },
})
```

- [ ] **Step 4.4: Write `lesson-loader.js`**

Create `site/assets/runtime/lesson-loader.js`:

```javascript
// Fetch lesson Markdown by id (frontmatter + body).
// Exposes window.LiaScriptLoader.fetchLesson.
(function () {
  const BASE = '/content'

  async function fetchLesson(id) {
    const meta = await fetchMeta()
    const entry = meta.lessons.find((l) => l.id === id)
    if (!entry) {
      throw new Error('Lesson not found: ' + id)
    }
    const url = BASE + '/' + entry.chapter_dir + '/' + entry.file
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error('Failed to load ' + url + ': ' + res.status)
    }
    return await res.text()
  }

  let metaPromise = null
  function fetchMeta() {
    if (!metaPromise) {
      metaPromise = fetch('/content/manifest.json', { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error('manifest fetch failed: ' + r.status)
        return r.json()
      })
    }
    return metaPromise
  }

  window.LiaScriptLoader = { fetchLesson }
})()
```

- [ ] **Step 4.5: Write failing tests**

Create `tests/runtime/test_lesson_loader.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('LiaScriptLoader.fetchLesson', () => {
  beforeEach(() => {
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
```

- [ ] **Step 4.6: Run vitest**

```bash
npx vitest run tests/runtime/test_lesson_loader.test.js
```

Expected: 2 passed.

- [ ] **Step 4.7: Create stub lesson and placeholder manifest**

Create `content/ch01-getting-started/01-hello.md`:

```markdown
---
id: ch01-l01-hello
chapter: 1
order: 1
title:
  en: "Stub"
  zh: "占位"
description:
  en: "Stub lesson — replaced in Task 9."
  zh: "占位课程——Task 9 替换。"
estimated_minutes: 1
objectives: []
starter_code: ""
solution: ""
hints: []
checks: []
---

# Stub

Replaced in Task 9.
```

Create `content/manifest.json`:

```json
{
  "lessons": [
    {
      "id": "ch01-l01-hello",
      "chapter_dir": "ch01-getting-started",
      "file": "01-hello.md"
    }
  ]
}
```

(Note: This placeholder manifest is intentionally minimal. Task 9 regenerates it from the real lesson frontmatter via `build-manifest`. The placeholder simply lists the stub so the lesson loader can find it before the manifest builder runs.)

- [ ] **Step 4.8: Write theme + mobile CSS**

Create `site/assets/styles/theme.css`:

```css
:root {
  --bg: #ffffff;
  --fg: #1a1a1a;
  --accent: #2563eb;
  --muted: #6b7280;
  --ok: #16a34a;
  --err: #dc2626;
}
body {
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  line-height: 1.5;
}
.lesson-output {
  background: #0b1020;
  color: #e5e7eb;
  padding: 0.75rem;
  border-radius: 6px;
  overflow: auto;
  font-family: ui-monospace, monospace;
  font-size: 14px;
}
.lesson-answer {
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 6px;
  font-family: ui-monospace, monospace;
  font-size: 14px;
}
button {
  font-size: 16px;
  padding: 0.5rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}
button:hover { background: #f9fafb; }
```

Create `site/assets/styles/mobile.css`:

```css
/* Sticky controls so Run/Check stay above the iOS soft keyboard */
.lesson-controls {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
  z-index: 10;
}

/* Smallest phone */
@media (min-width: 360px) {
  main { padding: 0.5rem; }
  .editor-wrap { padding: 0.5rem; }
}

/* Tablet */
@media (min-width: 768px) {
  main { padding: 1rem; }
  .editor-wrap { padding: 1rem; }
}

/* Desktop */
@media (min-width: 1024px) {
  main { max-width: 960px; margin: 0 auto; }
  .editor-wrap { max-width: 960px; margin: 0 auto; }
}
```

- [ ] **Step 4.9: Replace `site/index.html`**

Replace `site/index.html` with:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Python Interactive Tutorial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/assets/styles/theme.css">
  <link rel="stylesheet" href="/assets/styles/mobile.css">
  <script src="https://cdn.jsdelivr.net/gh/liascript/liascript-template@master/dist/liascript.min.js" defer></script>
  <script src="/assets/runtime/lesson-loader.js" defer></script>
  <script src="/assets/runtime/check-runner.js" defer></script>
</head>
<body>
  <header style="padding:1rem; border-bottom:1px solid #e5e7eb;">
    <h1 style="margin:0; font-size:1.2rem;">Python Interactive Tutorial</h1>
  </header>
  <main>
    <p id="loading" style="color:#6b7280;">Loading lesson…</p>
    <article id="lia-container"></article>
    <h2>Try it</h2>
    <div id="editor-host" class="editor-wrap"></div>
    <section id="lesson-controls" class="lesson-controls"></section>
  </main>
</body>
</html>
```

Note: `check-runner.js` is referenced now even though Task 6 adds the real logic; the file is created in Task 6.

- [ ] **Step 4.10: Verify locally**

```bash
cd site && uv run python -m http.server 8000
```

Open `http://localhost:8000/?id=ch01-l01-hello`. Expected: page loads, the heading "Stub" appears, no JS console errors. Stop server (Ctrl-C).

- [ ] **Step 4.11: Commit**

```bash
git add package.json package-lock.json vitest.config.js site/ content/
git commit -m "feat(site): LiaScript loader + stub lesson + theme/mobile CSS"
```

---

## Task 5: Pyodide Web Worker with 5-second hard timeout

**Files:**
- Create: `site/assets/runtime/pyodide-worker.js`
- Create: `site/assets/runtime/run-code.js`
- Create: `tests/runtime/test_run_code_timeout.test.js`

**Interfaces:**
- Produces: Web Worker that loads Pyodide on first message; handles `{type: 'run_code', code}` → posts `{type: 'result', stdout, stderr, error}` or `{type: 'error', error}`
- Produces: main-thread `window.runCode(code: string) → Promise<{stdout: string, stderr: string, error: string|null}>` with 5-second hard timeout (worker terminated on timeout)

- [ ] **Step 5.1: Write Pyodide worker**

Create `site/assets/runtime/pyodide-worker.js`:

```javascript
// Web Worker hosting Pyodide v0.26.
// Receives: { type: 'run_code', code: string }
// Posts:    { type: 'result', stdout, stderr, error } | { type: 'error', error }
// Receives: { type: 'run_ast_checks', code, checks, astRulesSource }
// Posts:    { type: 'ast_result', passed, error }
// Note: importScripts is CORS-friendly for cross-origin scripts in workers;
// Pyodide's CDN serves with permissive CORS headers.

const PYODIDE_VERSION = 'v0.26.2'
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/' + PYODIDE_VERSION + '/full/'

let pyodide = null
let loadingPromise = null

function ensurePyodide() {
  if (pyodide) return Promise.resolve(pyodide)
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    importScripts(PYODIDE_BASE + 'pyodide.js')
    pyodide = await self.loadPyodide({ indexURL: PYODIDE_BASE })
    return pyodide
  })()
  return loadingPromise
}

self.onmessage = async (e) => {
  const msg = e.data
  if (msg.type === 'run_ast_checks') {
    try {
      const py = await ensurePyodide()
      await py.runPythonAsync(msg.astRulesSource)
      const checkJson = JSON.stringify(msg.checks)
      const codeJson = JSON.stringify(msg.code)
      const resultJson = py.runPython(
        'import json\n' +
        'check = json.loads(' + checkJson + ')\n' +
        'code = json.loads(' + codeJson + ')\n' +
        'passed, err = run_ast_check(code, check)\n' +
        'json.dumps({"passed": passed, "error": err})\n'
      )
      const parsed = JSON.parse(resultJson)
      self.postMessage({ type: 'ast_result', passed: parsed.passed, error: parsed.error })
    } catch (err) {
      self.postMessage({ type: 'ast_result', passed: false, error: String(err) })
    }
    return
  }
  if (msg.type !== 'run_code') return
  try {
    const py = await ensurePyodide()
    let stdout = ''
    let stderr = ''
    py.setStdout({ batched: (s) => { stdout += s + '\n' } })
    py.setStderr({ batched: (s) => { stderr += s + '\n' } })
    let error = null
    try {
      await py.runPythonAsync(msg.code)
    } catch (err) {
      error = String(err)
    }
    self.postMessage({ type: 'result', stdout, stderr, error })
  } catch (err) {
    self.postMessage({ type: 'error', error: String(err) })
  }
}
```

- [ ] **Step 5.2: Write main-thread `run-code.js` with timeout**

Create `site/assets/runtime/run-code.js`:

```javascript
// Main-thread helper: spawns a fresh Pyodide worker per call, with a 5s hard timeout.
// Exposes window.runCode(code) -> Promise<{stdout, stderr, error}>.

(function () {
  const TIMEOUT_MS = 5000

  function runOnce(worker, code) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        worker.terminate()
        resolve({ stdout: '', stderr: '', error: 'TimeoutError: code exceeded 5 seconds' })
      }, TIMEOUT_MS)
      worker.onmessage = (e) => {
        clearTimeout(timer)
        if (e.data.type === 'result') resolve(e.data)
        else if (e.data.type === 'error') resolve({ stdout: '', stderr: '', error: e.data.error })
        else resolve({ stdout: '', stderr: '', error: 'Unknown worker message: ' + JSON.stringify(e.data) })
      }
      worker.onerror = (e) => {
        clearTimeout(timer)
        resolve({ stdout: '', stderr: '', error: 'Worker error: ' + e.message })
      }
      worker.postMessage({ type: 'run_code', code })
    })
  }

  window.runCode = function runCode(code) {
    const worker = new Worker('/assets/runtime/pyodide-worker.js')
    return runOnce(worker, code)
  }
})()
```

- [ ] **Step 5.3: Write failing test for timeout**

Create `tests/runtime/test_run_code_timeout.test.js`:

```javascript
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
```

- [ ] **Step 5.4: Run test**

```bash
npx vitest run tests/runtime/test_run_code_timeout.test.js
```

Expected: 1 passed.

- [ ] **Step 5.5: Commit**

```bash
git add site/assets/runtime/pyodide-worker.js site/assets/runtime/run-code.js tests/runtime/test_run_code_timeout.test.js
git commit -m "feat(runtime): Pyodide Web Worker with 5-second hard timeout"
```

---

## Task 6: Check runner — Python validator + JS orchestrator

This task creates both the Python AST rules (used by content validation in Task 10) and the JS check orchestrator that delegates AST and output checks to Pyodide.

**Files:**
- Create: `src/py_tutorial_build/ast_rules.py`
- Create: `tests/test_ast_rules.py`
- Create: `site/assets/runtime/check-runner.js`
- Create: `tests/runtime/test_check_runner.test.js`
- Create: `scripts/copy_ast_rules.py`
- Create: `site/assets/runtime/ast_rules.py.js` (generated; commit it so worker can fetch)

**Interfaces:**
- Produces (Python): `py_tutorial_build.ast_rules.run_ast_check(code: str, check: dict) → tuple[bool, str|None]` and `validate_ast_check(check: dict) → list[str]`
- Produces (JS): `window.CheckRunner.runChecks(code: string, checks: Check[]) → Promise<{passed: bool, errors: string[], hints: string[]}>` where Check is one of:
  - `{kind: 'output', expected: string}`
  - `{kind: 'ast', must_contain?: string|string[], must_not_contain?: string|string[], must_contain_call?: string, must_define_function?: string, min_lines?: number, max_lines?: number}`
- Produces (JS): `window.CheckRunner.parseFrontmatter(md: string) → {meta: object, body: string}` (lightweight YAML line parser)

- [ ] **Step 6.1: Write failing Python tests**

Create `tests/test_ast_rules.py`:

```python
import pytest

from py_tutorial_build.ast_rules import run_ast_check, validate_ast_check


class TestRunAstCheck:
    def test_must_contain_call_passes(self) -> None:
        assert run_ast_check('print("hi")', {"kind": "ast", "must_contain_call": "print"})[0] is True

    def test_must_contain_call_fails_when_missing(self) -> None:
        passed, err = run_ast_check('print("hi")', {"kind": "ast", "must_contain_call": "len"})
        assert passed is False
        assert "len" in (err or "")

    def test_must_not_contain_fails_when_present(self) -> None:
        passed, err = run_ast_check('import os', {"kind": "ast", "must_not_contain": "Import"})
        assert passed is False
        assert "Import" in (err or "")

    def test_must_define_function(self) -> None:
        assert run_ast_check('def greet(): pass', {"kind": "ast", "must_define_function": "greet"})[0] is True

    def test_syntax_error_returns_syntax_error(self) -> None:
        passed, err = run_ast_check('def broken(:', {"kind": "ast", "must_contain_call": "print"})
        assert passed is False
        assert "SyntaxError" in (err or "")

    def test_min_lines(self) -> None:
        assert run_ast_check('x = 1', {"kind": "ast", "min_lines": 3})[0] is False

    def test_max_lines(self) -> None:
        assert run_ast_check('x = 1\ny = 2', {"kind": "ast", "max_lines": 1})[0] is False


class TestValidateAstCheck:
    def test_unknown_node_name(self) -> None:
        errs = validate_ast_check({"kind": "ast", "must_contain": ["NotARealNode"]})
        assert any("NotARealNode" in e for e in errs)

    def test_unknown_check_key(self) -> None:
        errs = validate_ast_check({"kind": "ast", "what_is_this": 1})
        assert any("unknown ast check key" in e for e in errs)

    def test_min_lines_negative(self) -> None:
        errs = validate_ast_check({"kind": "ast", "min_lines": -1})
        assert any("non-negative integer" in e for e in errs)
```

- [ ] **Step 6.2: Run tests — should fail**

```bash
uv run pytest tests/test_ast_rules.py -v
```

Expected: FAIL (module not found).

- [ ] **Step 6.3: Implement `ast_rules.py`**

Create `src/py_tutorial_build/ast_rules.py`:

```python
"""Validate and run AST-based check rules.

The same algorithm runs in two places:
  - At content-validation time, via pytest (this file).
  - At lesson runtime, via Pyodide inside the check-runner worker.

Keep the logic identical so authoring-time validation matches runtime checks.
"""
from __future__ import annotations

import ast
from typing import Any

VALID_AST_NODES: set[str] = {
    "Import", "ImportFrom", "FunctionDef", "AsyncFunctionDef", "ClassDef",
    "If", "For", "While", "With", "Try", "Return", "Yield", "Assign",
    "AugAssign", "Call", "Lambda", "ListComp", "DictComp", "SetComp",
    "GeneratorExp",
}

VALID_AST_CHECK_KEYS: set[str] = {
    "must_contain", "must_not_contain", "must_contain_call",
    "must_define_function", "min_lines", "max_lines",
}


def validate_ast_check(check: dict[str, Any]) -> list[str]:
    """Return a list of error messages (empty if valid)."""
    errors: list[str] = []
    if check.get("kind") != "ast":
        return errors
    for key in check:
        if key not in {"kind"} | VALID_AST_CHECK_KEYS:
            errors.append("unknown ast check key: " + key)
    for key in ("must_contain", "must_not_contain"):
        val = check.get(key)
        if val is None:
            continue
        items = val if isinstance(val, list) else [val]
        for item in items:
            if not isinstance(item, str) or item not in VALID_AST_NODES:
                errors.append(key + ": invalid AST node name '" + str(item) + "'")
    call = check.get("must_contain_call")
    if call is not None and not isinstance(call, str):
        errors.append("must_contain_call: must be a string")
    fn = check.get("must_define_function")
    if fn is not None and not isinstance(fn, str):
        errors.append("must_define_function: must be a string")
    for key in ("min_lines", "max_lines"):
        val = check.get(key)
        if val is not None and (not isinstance(val, int) or val < 0):
            errors.append(key + ": must be a non-negative integer")
    return errors


def run_ast_check(code: str, check: dict[str, Any]) -> tuple[bool, str | None]:
    """Run a single AST check. Returns (passed, error_message)."""
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return False, "SyntaxError: " + str(exc.msg) + " (line " + str(exc.lineno) + ")"

    lines = code.splitlines()

    for key in ("must_contain", "must_not_contain"):
        val = check.get(key)
        if val is None:
            continue
        items = val if isinstance(val, list) else [val]
        for item in items:
            present = _has_node(tree, item)
            if key == "must_contain" and not present:
                return False, "Expected AST node '" + item + "' not found"
            if key == "must_not_contain" and present:
                return False, "Did not expect AST node '" + item + "' but found it"

    call = check.get("must_contain_call")
    if call is not None and not _has_call(tree, call):
        return False, "Expected call to '" + call + "()' not found"

    fn = check.get("must_define_function")
    if fn is not None and not _has_function(tree, fn):
        return False, "Expected function definition '" + fn + "' not found"

    if "min_lines" in check and len(lines) < check["min_lines"]:
        return False, "Code too short: " + str(len(lines)) + " < " + str(check["min_lines"]) + " lines"
    if "max_lines" in check and len(lines) > check["max_lines"]:
        return False, "Code too long: " + str(len(lines)) + " > " + str(check["max_lines"]) + " lines"

    return True, None


def _has_node(tree: ast.AST, name: str) -> bool:
    return any(node.__class__.__name__ == name for node in ast.walk(tree))


def _has_call(tree: ast.AST, name: str) -> bool:
    return any(
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == name
        for node in ast.walk(tree)
    )


def _has_function(tree: ast.AST, name: str) -> bool:
    return any(
        isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name
        for node in ast.walk(tree)
    )
```

- [ ] **Step 6.4: Run Python tests — should pass**

```bash
uv run pytest tests/test_ast_rules.py -v
```

Expected: 10 passed.

- [ ] **Step 6.5: Generate the worker-side bundle**

The worker fetches `/assets/runtime/ast_rules.py.js` (raw Python source) and runs it inside Pyodide. We populate that file by copying `src/py_tutorial_build/ast_rules.py` verbatim.

Create `scripts/copy_ast_rules.py`:

```python
"""Copy src/py_tutorial_build/ast_rules.py into site/assets/runtime/ast_rules.py.js.

This is run by hand (or by the content CI job) whenever ast_rules.py changes.
Future phases can replace this with a proper bundler.
"""
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src" / "py_tutorial_build" / "ast_rules.py"
DST = Path(__file__).resolve().parent.parent / "site" / "assets" / "runtime" / "ast_rules.py.js"


def main() -> int:
    DST.parent.mkdir(parents=True, exist_ok=True)
    DST.write_text(SRC.read_text(encoding="utf-8"), encoding="utf-8")
    print("wrote", DST)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

Run it:

```bash
uv run python scripts/copy_ast_rules.py
ls site/assets/runtime/ast_rules.py.js
```

Expected: file exists.

- [ ] **Step 6.6: Write `check-runner.js` (orchestrator)**

Create `site/assets/runtime/check-runner.js`:

```javascript
// Browser-side check orchestrator.
// Exposes:
//   window.CheckRunner.runChecks(code, checks) -> Promise<{passed, errors, hints}>
//   window.CheckRunner.parseFrontmatter(md) -> {meta, body}
//
// Output checks run via window.runCode (Pyodide worker).
// AST checks run inside the same Pyodide worker, which loads
// run_ast_check from the bundled ast_rules.py.js source.

(function () {
  let astRulesSourcePromise = null
  function loadAstRulesSource() {
    if (!astRulesSourcePromise) {
      astRulesSourcePromise = fetch('/assets/runtime/ast_rules.py.js', { cache: 'force-cache' })
        .then((r) => {
          if (!r.ok) throw new Error('Failed to load ast_rules.py.js: ' + r.status)
          return r.text()
        })
    }
    return astRulesSourcePromise
  }

  async function runAstChecksInPyodide(code, checks) {
    const worker = new Worker('/assets/runtime/pyodide-worker.js')
    try {
      const astSrc = await loadAstRulesSource()
      const TIMEOUT_MS = 5000
      return await new Promise((resolve) => {
        const timer = setTimeout(() => {
          worker.terminate()
          resolve({ passed: false, error: 'TimeoutError: AST check exceeded 5 seconds' })
        }, TIMEOUT_MS)
        worker.onmessage = (e) => {
          clearTimeout(timer)
          if (e.data.type === 'ast_result') resolve(e.data)
          else resolve({ passed: false, error: 'Unexpected worker message: ' + JSON.stringify(e.data) })
        }
        worker.onerror = (e) => {
          clearTimeout(timer)
          resolve({ passed: false, error: 'Worker error: ' + e.message })
        }
        worker.postMessage({
          type: 'run_ast_checks',
          code,
          checks,
          astRulesSource: astSrc,
        })
      })
    } catch (err) {
      worker.terminate()
      return { passed: false, error: String(err) }
    }
  }

  async function runChecks(code, checks) {
    const errors = []
    const hints = []
    for (const check of checks) {
      if (check.kind === 'output') {
        const r = await window.runCode(code)
        if ((r.stdout || '') !== (check.expected || '')) {
          errors.push('Output mismatch.\nExpected: ' + JSON.stringify(check.expected) +
                      '\nGot: ' + JSON.stringify(r.stdout))
        }
      } else if (check.kind === 'ast') {
        const r = await runAstChecksInPyodide(code, check)
        if (!r.passed) errors.push(r.error || 'AST check failed')
      } else {
        errors.push('Unknown check kind: ' + check.kind)
      }
    }
    return { passed: errors.length === 0, errors, hints }
  }

  // Tiny frontmatter parser: reads scalar `key: value` lines at the top of a file.
  // The lesson page only needs simple scalars; nested objects (title, hints)
  // are JSON-encoded into a `lesson.json` companion at build time in M3.
  function parseFrontmatter(md) {
    const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!m) return { meta: {}, body: md }
    const meta = {}
    for (const line of m[1].split('\n')) {
      const mm = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
      if (mm) meta[mm[1]] = mm[2]
    }
    return { meta, body: m[2] }
  }

  window.CheckRunner = { runChecks, parseFrontmatter }
})()
```

- [ ] **Step 6.7: Write jsdom test for parseFrontmatter**

Create `tests/runtime/test_check_runner.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'

describe('CheckRunner.parseFrontmatter', () => {
  beforeEach(() => { delete window.CheckRunner })

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
```

- [ ] **Step 6.8: Run all vitest**

```bash
npx vitest run
```

Expected: 5 passed (2 lesson-loader + 1 timeout + 2 check-runner).

- [ ] **Step 6.9: Commit**

```bash
git add src/py_tutorial_build/ast_rules.py tests/test_ast_rules.py scripts/copy_ast_rules.py site/assets/runtime/check-runner.js site/assets/runtime/ast_rules.py.js tests/runtime/test_check_runner.test.js
git commit -m "feat(runtime): check orchestrator with output + AST kinds via Pyodide worker"
```

---

## Task 7: Lesson UI — Run / Check / Hint / Show Answer + CodeMirror editor

**Files:**
- Create: `site/assets/runtime/code-editor.js`
- Create: `site/assets/runtime/ui-controls.js`
- Modify: `site/index.html` (wire up editor + buttons)

**Interfaces:**
- Produces: `window.createEditor(parent: HTMLElement, initial: string) → EditorView` (CodeMirror 6 instance, `font-size: 16px`, Python syntax)
- Produces: `window.UIControls.bind({lesson, getCode, onPass})` that wires Run / Check / Hint / Show Answer buttons into `#lesson-controls`

- [ ] **Step 7.1: Add CodeMirror dependencies**

```bash
npm install codemirror @codemirror/lang-python @codemirror/state @codemirror/view @codemirror/commands @codemirror/language
```

- [ ] **Step 7.2: Write `code-editor.js`**

Create `site/assets/runtime/code-editor.js`:

```javascript
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'

function createEditor(parent, initial) {
  const state = EditorState.create({
    doc: initial || '',
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      python(),
      EditorView.theme({
        '&': { fontSize: '16px' },
        '.cm-scroller': { fontFamily: 'ui-monospace, monospace' },
      }),
      EditorView.lineWrapping,
    ],
  })
  return new EditorView({ state, parent })
}

window.createEditor = createEditor
```

- [ ] **Step 7.3: Write `ui-controls.js`**

Create `site/assets/runtime/ui-controls.js`:

```javascript
// Wires Run / Check / Hint / Show Answer buttons.
// window.UIControls.bind({lesson, getCode, onPass})

(function () {
  function el(tag, props, children) {
    const e = document.createElement(tag)
    if (props) Object.assign(e, props)
    for (const c of children || []) e.appendChild(c)
    return e
  }

  function bind({ lesson, getCode, onPass }) {
    const root = document.getElementById('lesson-controls')
    root.innerHTML = ''
    const out = el('pre', { id: 'output', className: 'lesson-output' })
    const hintBox = el('div', { id: 'hints', className: 'lesson-hints' })
    const answerBox = el('pre', { id: 'answer', className: 'lesson-answer', hidden: true })

    let hintIdx = 0
    const hints = lesson.hints || []

    const runBtn = el('button', { type: 'button', textContent: 'Run' })
    runBtn.onclick = async () => {
      out.textContent = 'Running…'
      const r = await window.runCode(getCode())
      const parts = []
      if (r.stdout) parts.push(r.stdout)
      if (r.stderr) parts.push('[stderr] ' + r.stderr)
      if (r.error) parts.push('[error] ' + r.error)
      out.textContent = parts.join('\n') || '(no output)'
    }

    const checkBtn = el('button', { type: 'button', textContent: 'Check' })
    checkBtn.onclick = async () => {
      out.textContent = 'Checking…'
      const r = await window.CheckRunner.runChecks(getCode(), lesson.checks || [])
      if (r.passed) {
        out.textContent = '✓ All checks passed!'
        if (onPass) onPass()
      } else {
        out.textContent = '✗ Failed:\n' + r.errors.join('\n')
      }
    }

    const hintBtn = el('button', { type: 'button', textContent: 'Hint' })
    hintBtn.onclick = () => {
      if (hintIdx >= hints.length) {
        hintBox.textContent = 'No more hints.'
        return
      }
      const h = hints[hintIdx++]
      hintBox.textContent = 'Hint ' + hintIdx + '/' + hints.length + ': ' + (h.en || h.zh || '')
    }

    const answerBtn = el('button', { type: 'button', textContent: 'Show Answer' })
    answerBtn.onclick = () => {
      answerBox.hidden = !answerBox.hidden
      answerBox.textContent = lesson.solution || ''
      answerBtn.textContent = answerBox.hidden ? 'Show Answer' : 'Hide Answer'
    }

    root.append(runBtn, checkBtn, hintBtn, answerBtn, out, hintBox, answerBox)
  }

  window.UIControls = { bind }
})()
```

- [ ] **Step 7.4: Replace `site/index.html` body content**

Edit `site/index.html`. The `<head>` from Task 4.9 stays. Replace the `<main>` block with:

```html
  <main>
    <p id="loading" style="color:#6b7280;">Loading lesson…</p>
    <article id="lia-container"></article>
    <h2>Try it</h2>
    <div id="editor-host" class="editor-wrap"></div>
    <section id="lesson-controls" class="lesson-controls"></section>
  </main>
  <script type="module">
    import { createEditor } from '/assets/runtime/code-editor.js'

    const params = new URLSearchParams(location.search)
    const id = params.get('id') || 'ch01-l01-hello'
    const md = await window.LiaScriptLoader.fetchLesson(id)
    const { meta, body } = window.CheckRunner.parseFrontmatter(md)
    document.getElementById('loading').remove()
    document.getElementById('lia-container').innerText = body

    const view = createEditor(document.getElementById('editor-host'), meta.starter_code || '')

    if (meta.title) {
      const h = document.querySelector('header h1')
      if (h) h.textContent = meta.title
    }

    window.UIControls.bind({
      lesson: meta,
      getCode: () => view.state.doc.toString(),
      onPass: () => window.Progress && window.Progress.markDone(id),
    })
  </script>
```

- [ ] **Step 7.5: Verify locally**

```bash
cd site && uv run python -m http.server 8000
```

Open `http://localhost:8000/?id=ch01-l01-hello`.
Expected: page loads; the stub lesson body appears; an empty editor is visible below; four buttons (Run / Check / Hint / Show Answer) appear in the sticky footer. Clicking Run with no code should show `(no output)`. Stop server (Ctrl-C).

- [ ] **Step 7.6: Commit**

```bash
git add site/assets/runtime/code-editor.js site/assets/runtime/ui-controls.js site/index.html package.json package-lock.json
git commit -m "feat(ui): CodeMirror editor + Run/Check/Hint/Show Answer controls"
```

---

## Task 8: progress.js — localStorage + JSON import/export

**Files:**
- Create: `site/assets/runtime/progress.js`
- Create: `tests/runtime/test_progress.test.js`
- Modify: `site/index.html` (add Export/Import buttons + load `progress.js`)

**Interfaces:**
- Produces: `window.Progress.markDone(id)`, `getDone()`, `setCode(id, code)`, `getCode(id)`, `setCurrent(id)`, `getCurrent()`, `setLanguage(lang)`, `getLanguage()`, `exportJSON()`, `importJSON(file) → Promise<{...}>`
- Storage key: `py-tutorial:v1`

- [ ] **Step 8.1: Write `progress.js`**

Create `site/assets/runtime/progress.js`:

```javascript
(function () {
  const KEY = 'py-tutorial:v1'

  function empty() {
    return { version: 1, language: 'en', done: [], current: null, code: {}, updated: null }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return empty()
      const obj = JSON.parse(raw)
      if (obj.version !== 1) return empty()
      return obj
    } catch {
      return empty()
    }
  }

  function save(s) {
    s.updated = new Date().toISOString()
    localStorage.setItem(KEY, JSON.stringify(s))
  }

  function markDone(id) {
    const s = load()
    if (!s.done.includes(id)) s.done.push(id)
    save(s)
  }

  function getDone() { return load().done }

  function setCode(id, code) {
    const s = load(); s.code[id] = code; save(s)
  }
  function getCode(id) { return load().code[id] || '' }

  function setCurrent(id) {
    const s = load(); s.current = id; save(s)
  }
  function getCurrent() { return load().current }

  function setLanguage(lang) {
    const s = load(); s.language = lang; save(s)
  }
  function getLanguage() { return load().language || 'en' }

  function exportJSON() {
    const data = load()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'py-tutorial-progress.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importJSON(file) {
    const text = await file.text()
    const obj = JSON.parse(text)
    if (obj.version !== 1) throw new Error('Unsupported progress version: ' + obj.version)
    save(obj)
    return obj
  }

  window.Progress = { markDone, getDone, setCode, getCode, setCurrent, getCurrent, setLanguage, getLanguage, exportJSON, importJSON }
})()
```

- [ ] **Step 8.2: Write failing test**

Create `tests/runtime/test_progress.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Progress', () => {
  beforeEach(() => {
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
```

- [ ] **Step 8.3: Run tests**

```bash
npx vitest run tests/runtime/test_progress.test.js
```

Expected: 4 passed.

- [ ] **Step 8.4: Add Export/Import buttons to `index.html`**

In `site/index.html`, before `</body>`, add:

```html
  <div class="progress-controls" style="padding:0.5rem;">
    <button type="button" id="btn-export">Export Progress</button>
    <input type="file" id="file-import" accept="application/json" hidden>
    <button type="button" id="btn-import">Import Progress</button>
  </div>
  <script src="/assets/runtime/progress.js" defer></script>
  <script>
    document.getElementById('btn-export').onclick = () => window.Progress && window.Progress.exportJSON()
    document.getElementById('btn-import').onclick = () => document.getElementById('file-import').click()
    document.getElementById('file-import').onchange = async (e) => {
      const f = e.target.files[0]
      if (f) await window.Progress.importJSON(f)
    }
  </script>
```

- [ ] **Step 8.5: Verify locally**

```bash
cd site && uv run python -m http.server 8000
```

Open `http://localhost:8000/?id=ch01-l01-hello`, click Export Progress → JSON file downloads. Stop server.

- [ ] **Step 8.6: Commit**

```bash
git add site/assets/runtime/progress.js site/index.html tests/runtime/test_progress.test.js
git commit -m "feat(progress): localStorage progress + JSON import/export"
```

---

## Task 9: build_manifest.py + real hello lesson

**Files:**
- Create: `src/py_tutorial_build/build_manifest.py`
- Create: `tests/test_build_manifest.py`
- Modify: `content/ch01-getting-started/01-hello.md` (replace stub with full content)
- Modify: `content/manifest.json` (regenerated by the script)

**Interfaces:**
- Produces: `py_tutorial_build.build_manifest.build_manifest(content_dir, out_path)` that scans `content/**/*.md`, parses YAML frontmatter, sorts by `(chapter, order, id)`, writes JSON
- Produces: console script `build-manifest` (already declared in Task 1)

- [ ] **Step 9.1: Write failing test**

Create `tests/test_build_manifest.py`:

```python
import json
from pathlib import Path

import pytest

from py_tutorial_build.build_manifest import build_manifest


def test_build_manifest_writes_lesson_index(tmp_path: Path) -> None:
    content_dir = tmp_path / "content"
    ch_dir = content_dir / "ch01-getting-started"
    ch_dir.mkdir(parents=True)
    (ch_dir / "01-hello.md").write_text(
        "---\n"
        "id: ch01-l01-hello\n"
        "chapter: 1\n"
        "order: 1\n"
        "title:\n  en: Hi\n  zh: 嗨\n"
        "---\n"
        "# hi\n"
    )

    out = content_dir / "manifest.json"
    build_manifest(content_dir, out)

    data = json.loads(out.read_text())
    assert len(data["lessons"]) == 1
    entry = data["lessons"][0]
    assert entry["id"] == "ch01-l01-hello"
    assert entry["chapter_dir"] == "ch01-getting-started"
    assert entry["file"] == "01-hello.md"
    assert entry["chapter"] == 1
    assert entry["order"] == 1


def test_build_manifest_orders_by_chapter_then_order(tmp_path: Path) -> None:
    content_dir = tmp_path / "content"
    ch_dir = content_dir / "ch01-getting-started"
    ch_dir.mkdir(parents=True)
    (ch_dir / "02-second.md").write_text("---\nid: ch01-l02\nchapter: 1\norder: 2\n---\n")
    (ch_dir / "01-first.md").write_text("---\nid: ch01-l01\nchapter: 1\norder: 1\n---\n")

    out = content_dir / "manifest.json"
    build_manifest(content_dir, out)

    ids = [e["id"] for e in json.loads(out.read_text())["lessons"]]
    assert ids == ["ch01-l01", "ch01-l02"]


def test_build_manifest_skips_files_without_id(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    content_dir = tmp_path / "content"
    content_dir.mkdir()
    (content_dir / "no-id.md").write_text("---\nchapter: 1\n---\n")

    out = content_dir / "manifest.json"
    build_manifest(content_dir, out)
    captured = capsys.readouterr()
    assert "no-id" in captured.err
    assert json.loads(out.read_text())["lessons"] == []
```

- [ ] **Step 9.2: Run tests — should fail**

```bash
uv run pytest tests/test_build_manifest.py -v
```

Expected: FAIL (module not found).

- [ ] **Step 9.3: Implement `build_manifest.py`**

Create `src/py_tutorial_build/build_manifest.py`:

```python
"""Generate content/manifest.json by scanning content/**/*.md files."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml


def _parse_frontmatter(md_path: Path) -> dict:
    text = md_path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(str(md_path) + ": missing frontmatter")
    end = text.find("\n---\n", 4)
    if end < 0:
        raise ValueError(str(md_path) + ": unterminated frontmatter")
    fm = text[4:end]
    parsed = yaml.safe_load(fm)
    return parsed if isinstance(parsed, dict) else {}


def build_manifest(content_dir: Path, out_path: Path) -> None:
    """Scan content_dir for .md files, parse frontmatter, write out_path."""
    entries: list[dict] = []
    for md_path in sorted(content_dir.rglob("*.md")):
        rel = md_path.relative_to(content_dir)
        try:
            fm = _parse_frontmatter(md_path)
        except ValueError as exc:
            print("skip " + str(rel) + ": " + str(exc), file=sys.stderr)
            continue
        lesson_id = fm.get("id")
        if not lesson_id:
            print("skip " + str(rel) + ": no id", file=sys.stderr)
            continue
        chapter_dir = rel.parts[0] if len(rel.parts) > 1 else ""
        entries.append({
            "id": lesson_id,
            "chapter_dir": chapter_dir,
            "file": rel.name,
            "chapter": fm.get("chapter", 0),
            "order": fm.get("order", 0),
        })
    entries.sort(key=lambda e: (e["chapter"], e["order"], e["id"]))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({"lessons": entries}, indent=2), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate content/manifest.json")
    parser.add_argument("--content-dir", default="content", type=Path)
    parser.add_argument("--out", default=None, type=Path,
                        help="Output path; defaults to <content-dir>/manifest.json")
    args = parser.parse_args(argv)
    content_dir = args.content_dir
    out_path = args.out or content_dir / "manifest.json"
    build_manifest(content_dir, out_path)
    count = len(json.loads(out_path.read_text())["lessons"])
    print("wrote " + str(out_path) + " (" + str(count) + " lessons)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 9.4: Run tests — should pass**

```bash
uv run pytest tests/test_build_manifest.py -v
```

Expected: 3 passed.

- [ ] **Step 9.5: Replace stub lesson with real content**

Replace `content/ch01-getting-started/01-hello.md` with:

```markdown
---
id: ch01-l01-hello
chapter: 1
order: 1
title:
  en: "Your First Program"
  zh: "你的第一个程序"
description:
  en: "Use print() to display text."
  zh: "用 print() 显示文字。"
estimated_minutes: 3
objectives:
  - en: "Write a print statement"
    zh: "编写 print 语句"
starter_code: |
  # Write a print statement below
solution: |
  print("Hello, World!")
hints:
  - en: "Use the print() function."
    zh: "用 print() 函数。"
  - en: "Strings go in quotes."
    zh: "字符串要放在引号里。"
checks:
  - kind: output
    expected: "Hello, World!\n"
  - kind: ast
    must_contain_call: print
    must_not_contain: [Import, While]
---

# Your First Program

Welcome! In Python, you use `print()` to display text.

## Try it

Replace the line below with code that prints `Hello, World!`.

```python
# your code here
```

When you see ✓, click **Next** to continue.
```

- [ ] **Step 9.6: Regenerate manifest**

```bash
uv run build-manifest
```

Expected: prints `wrote content/manifest.json (1 lessons)`.

Verify `content/manifest.json` now contains:

```json
{
  "lessons": [
    {
      "id": "ch01-l01-hello",
      "chapter_dir": "ch01-getting-started",
      "file": "01-hello.md",
      "chapter": 1,
      "order": 1
    }
  ]
}
```

- [ ] **Step 9.7: Commit**

```bash
git add src/py_tutorial_build/build_manifest.py tests/test_build_manifest.py content/ch01-getting-started/01-hello.md content/manifest.json
git commit -m "feat(content): real hello lesson + build_manifest script"
```

---

## Task 10: Lesson schema validation

**Files:**
- Create: `src/py_tutorial_build/schemas/lesson.schema.json`
- Create: `src/py_tutorial_build/lesson_schema.py`
- Create: `tests/test_lesson_schema.py`

**Interfaces:**
- Produces: `py_tutorial_build.lesson_schema.validate_lesson(md_path: Path) → list[str]` (empty if valid)
- Produces: pytest auto-discovery that validates every `content/**/*.md`

- [ ] **Step 10.1: Write `lesson.schema.json`**

Create `src/py_tutorial_build/schemas/lesson.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "chapter", "order", "title", "description", "starter_code", "solution", "checks"],
  "properties": {
    "id": { "type": "string", "pattern": "^ch\\d{2}-l\\d{2}-[a-z0-9-]+$" },
    "chapter": { "type": "integer", "minimum": 1 },
    "order": { "type": "integer", "minimum": 1 },
    "title": {
      "type": "object",
      "required": ["en"],
      "properties": {
        "en": { "type": "string", "minLength": 1 },
        "zh": { "type": "string" }
      }
    },
    "description": {
      "type": "object",
      "required": ["en"],
      "properties": {
        "en": { "type": "string", "minLength": 1 },
        "zh": { "type": "string" }
      }
    },
    "estimated_minutes": { "type": "integer", "minimum": 1 },
    "objectives": { "type": "array" },
    "starter_code": { "type": "string" },
    "solution": { "type": "string" },
    "hints": { "type": "array" },
    "checks": { "type": "array", "minItems": 1 },
    "errors": { "type": "object" },
    "tts": { "type": "object" }
  }
}
```

- [ ] **Step 10.2: Write failing test**

Create `tests/test_lesson_schema.py`:

```python
from pathlib import Path

import pytest

from py_tutorial_build.lesson_schema import validate_lesson


CONTENT_ROOT = Path(__file__).resolve().parent.parent / "content"


@pytest.mark.parametrize(
    "md_path",
    sorted(CONTENT_ROOT.rglob("*.md")),
    ids=lambda p: str(p.relative_to(CONTENT_ROOT)),
)
def test_every_lesson_validates(md_path: Path) -> None:
    errors = validate_lesson(md_path)
    assert errors == [], f"{md_path.name} failed: {errors}"
```

- [ ] **Step 10.3: Run test — should fail**

```bash
uv run pytest tests/test_lesson_schema.py -v
```

Expected: FAIL (module not found).

- [ ] **Step 10.4: Implement `lesson_schema.py`**

Create `src/py_tutorial_build/lesson_schema.py`:

```python
"""Validate lesson Markdown files against the JSON schema."""
from __future__ import annotations

import json
from pathlib import Path

import yaml
from jsonschema import Draft7Validator

from py_tutorial_build.ast_rules import validate_ast_check


SCHEMA_PATH = Path(__file__).parent / "schemas" / "lesson.schema.json"


def _extract_frontmatter(md_path: Path) -> dict:
    text = md_path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(str(md_path) + ": missing frontmatter")
    end = text.find("\n---\n", 4)
    if end < 0:
        raise ValueError(str(md_path) + ": unterminated frontmatter")
    parsed = yaml.safe_load(text[4:end])
    return parsed if isinstance(parsed, dict) else {}


def validate_lesson(md_path: Path) -> list[str]:
    """Return a list of error messages (empty if valid)."""
    fm = _extract_frontmatter(md_path)
    schema = json.loads(SCHEMA_PATH.read_text())
    validator = Draft7Validator(schema)
    errors: list[str] = []
    for err in sorted(validator.iter_errors(fm), key=lambda e: list(e.absolute_path)):
        path = ".".join(str(p) for p in err.absolute_path) or "<root>"
        errors.append(path + ": " + err.message)

    for i, check in enumerate(fm.get("checks", []) or []):
        if not isinstance(check, dict):
            errors.append("checks[" + str(i) + "]: not an object")
            continue
        if check.get("kind") == "ast":
            for sub_err in validate_ast_check(check):
                errors.append("checks[" + str(i) + "]: " + sub_err)
        elif check.get("kind") == "output":
            if "expected" not in check:
                errors.append("checks[" + str(i) + "]: output kind requires 'expected'")

    return errors
```

- [ ] **Step 10.5: Run tests**

```bash
uv run pytest tests/test_lesson_schema.py -v
```

Expected: 1 passed (the hello lesson).

- [ ] **Step 10.6: Commit**

```bash
git add src/py_tutorial_build/lesson_schema.py src/py_tutorial_build/schemas/lesson.schema.json tests/test_lesson_schema.py
git commit -m "test(content): validate every lesson Markdown against JSON schema"
```

---

## Task 11: CI integration + Pages deploy verification + manual E2E

**Files:**
- Modify: `.github/workflows/ci.yml` (add `npm ci`, vitest, build_manifest, lesson schema validation)
- Modify: `.github/workflows/deploy.yml` (regenerate manifest before publish)

**Interfaces:**
- Produces: CI that on every push/PR runs Python tests, JS tests, lesson schema validation, and a full lint+typecheck sweep
- Produces: Pages deploy that regenerates `content/manifest.json` before uploading

- [ ] **Step 11.1: Update `ci.yml`**

Replace `.github/workflows/ci.yml` with:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
      - name: Sync Python deps
        run: uv sync --all-extras
      - name: Install npm deps
        run: npm ci
      - name: Ruff lint
        run: uv run ruff check .
      - name: Ruff format check
        run: uv run ruff format --check .
      - name: Mypy
        run: uv run mypy src tests
      - name: Pytest (Python)
        run: uv run pytest --cov=src --cov-fail-under=80
      - name: Vitest (JS runtime)
        run: npx vitest run
      - name: Build manifest
        run: uv run build-manifest
      - name: Validate all lessons
        run: uv run pytest tests/test_lesson_schema.py -v
```

- [ ] **Step 11.2: Update `deploy.yml` — regenerate manifest**

Replace `.github/workflows/deploy.yml` with:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
      - name: Build manifest
        run: uv run build-manifest
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 11.3: Local dry-run**

Run each in sequence (all must exit 0):

```bash
uv run ruff check .
uv run ruff format --check .
uv run mypy src tests
uv run pytest --cov=src --cov-fail-under=80
npx vitest run
uv run build-manifest
uv run pytest tests/test_lesson_schema.py -v
```

- [ ] **Step 11.4: Push and verify CI + Pages**

```bash
git add .github/workflows/
git commit -m "ci: add vitest + lesson schema validation + manifest build on Pages deploy"
git push
```

Expected:
- GitHub Actions `test` job green (~2-3 min).
- GitHub Actions `deploy` job succeeds.
- Live page at `https://<user>.github.io/python/` shows the real "Your First Program" lesson.

- [ ] **Step 11.5: Manual end-to-end test on real devices**

On iOS Safari 16.4+ (or simulator) and Android Chrome 90+ (or emulator):

1. Open the Pages URL.
2. Click into "Your First Program" (or use `?id=ch01-l01-hello`).
3. Type `print("Hello, World!")` in the editor.
4. Tap **Run** → see `Hello, World!` in the output area.
5. Tap **Check** → see `✓ All checks passed!`.
6. Tap **Hint** → see hint text.
7. Tap **Show Answer** → see solution code.
8. Pull-to-refresh / navigate away and back → progress shows lesson as done (visible via the `py-tutorial:v1` localStorage entry, or a future "done" UI in M2).
9. Tap **Export Progress** → JSON file downloads.
10. Tap **Import Progress** → import a sample JSON file you prepared earlier.

Expected: all 10 steps work on both iOS Safari and Android Chrome. Pyodide cold start ≤20s; subsequent lessons ≤2s.

---

## Self-Review

### 1. Spec coverage

| Spec section / requirement | Implementing task(s) |
|---|---|
| §3.2 lesson schema (YAML frontmatter with bilingual fields) | Task 9 (real lesson), Task 10 (schema validator) |
| §3.3 check kinds — `output` and `ast` | Task 6 |
| §3.4 storage model (`py-tutorial:v1` JSON) | Task 8 |
| §3.5 mobile strategy — CSS breakpoints, font-size 16px, sticky controls | Task 4 (mobile.css), Task 7 (CodeMirror) |
| §3.5 lazy Pyodide load on first lesson | Task 5 (worker lazily loads on first message) |
| §4 directory structure | All tasks |
| §5 M0 (skeleton + CI) | Tasks 1, 2, 3 |
| §5 M1 (runtime MVP) | Tasks 4–11 |
| §6.2 M0 steps 1–8 | Tasks 1, 2, 3 |
| §6.2 M1 steps 9–21 | Tasks 4, 5, 6, 7, 8, 9, 10, 11 |
| §6.3 Phase 1 explicit non-goals | Respected (no PWA, no schema auto-deploy pre-M3, no Playwright, no multiple lessons) |

### 2. Placeholder scan

- No `TBD` / `TODO` / `implement later` in code or steps.
- Every code block contains real, runnable code.
- Every step has explicit commands and expected output.
- No "similar to Task N" cross-references — each step is self-contained.

### 3. Type / signature consistency

| Symbol | Defined in | Used in | Match? |
|---|---|---|---|
| `window.runCode(code) → Promise<{stdout, stderr, error}>` | Task 5.2 | Task 6.6 (runChecks) | ✓ |
| `window.CheckRunner.runChecks(code, checks) → Promise<{passed, errors, hints}>` | Task 6.6 | Task 7.3 (ui-controls) | ✓ |
| `window.CheckRunner.parseFrontmatter(md) → {meta, body}` | Task 6.6 | Task 7.4 (index.html) | ✓ |
| `window.LiaScriptLoader.fetchLesson(id) → Promise<string>` | Task 4.4 | Task 7.4 (index.html) | ✓ |
| `window.createEditor(parent, initial) → EditorView` | Task 7.2 | Task 7.4 (index.html) | ✓ |
| `window.UIControls.bind({lesson, getCode, onPass})` | Task 7.3 | Task 7.4 (index.html) | ✓ |
| `window.Progress.markDone/getDone/setCode/getCode/setCurrent/getCurrent/setLanguage/getLanguage/exportJSON/importJSON` | Task 8.1 | Task 7.4 (onPass), Task 8.4 (index.html) | ✓ |
| `py_tutorial_build.ast_rules.run_ast_check / validate_ast_check` | Task 6.3 | Task 6.1 (tests), Task 6.6 (Pyodide worker), Task 10.4 (lesson_schema.py) | ✓ |
| `py_tutorial_build.build_manifest.build_manifest(content_dir, out_path)` | Task 9.3 | Task 9.1 (tests), Task 11.1 (CI), Task 11.2 (deploy) | ✓ |
| `py_tutorial_build.lesson_schema.validate_lesson(md_path)` | Task 10.4 | Task 10.2 (tests) | ✓ |

### 4. Gaps found during self-review (fixed inline)

- **Spec §3.5 "Run button sticky"** — explicit `position: sticky; bottom: 0` added to `.lesson-controls` in Task 4.8 mobile.css. ✓
- **Spec §3.5 "Pyodide cross-origin anonymous"** — noted in pyodide-worker.js comment; `importScripts` is CORS-friendly and Pyodide CDN serves with permissive CORS. ✓
- **Spec §3.5 "Output truncation at 100KB"** — not implemented in Phase 1. Phase 1 only ships 1 trivial lesson; truncation added in M2. Documented as a known limit.
- **Spec §5 M1 acceptance "localStorage progress"** — covered by Task 8. ✓
- **Spec §5 M1 acceptance "JSON import/export"** — covered by Task 8. ✓
- **Spec §5 M1 acceptance "iOS Safari + Android Chrome real-device test"** — covered by Task 11.5. ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-20-phase-1-runtime-mvp.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
