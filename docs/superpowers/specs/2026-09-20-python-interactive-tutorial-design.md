# Python Interactive Tutorial — Design Spec

> **Date:** 2026-09-20
> **Status:** Draft for review
> **Audience:** human reviewer + future implementer (Claude Code agents)
> **Replaces:** `2026-09-20-python-curriculum-design.md` (different direction — that spec was local-CLI + AI tutor; this one is browser-based, in-browser Python, deployed to GitHub Pages)

---

## 1. Context & Goals

### What

An interactive, browser-based Python tutorial ("Python from Zero to Intermediate Apps"), authored as Markdown lessons, runnable entirely in the browser via Pyodide (WebAssembly Python), and deployed to GitHub Pages as a static site. Mobile-friendly, schema-driven content, no backend.

### Why

- A static GitHub Pages site is free, durable, and universally accessible.
- Pyodide lets learners run real Python without installing anything.
- Markdown is the easiest content format to author, version-control, and review.
- LiaScript provides Markdown-driven interactive courses with quizzes, code execution, TTS, and PWA out of the box.

### Goals

By completing this curriculum (~50–60 lessons), a learner can:

1. Read and explain idiomatic Python (data model, comprehensions, protocols, generators, decorators, context managers).
2. Write a tested, packaged, type-hinted Python module with CI.
3. Build a small web service (FastAPI or Flask) with persistence and tests.
4. Use SQL + an ORM, handle errors well, structure a non-trivial codebase.
5. Read other people's Python and identify smells / improvements.

### Non-Goals (MVP)

- Cloud accounts, server-side storage, social features.
- AI/LLM tutor integration (no API keys burned into static site).
- Course editor UI (content is PR-only).
- Full offline lesson editing (read-only cache only).
- TTS / audio narration (schema field reserved, not rendered).
- Multi-Python-version switcher.
- User-installed third-party packages.

### Target Users

- Zero-to-intermediate Python learners (mobile-first; phone browser must work).
- Target browsers: Safari iOS 16.4+ and Chrome Android 90+.

---

## 2. Core Decisions (resolved during brainstorming)

| Decision | Choice | Why |
|---|---|---|
| Course scope | Intermediate apps (~50–80 lessons) | User-selected midpoint |
| Progress storage | localStorage + JSON import/export | No backend; cross-device via file |
| Auto-check mechanism | Structural (AST) + output comparison | Covers 90% of cases |
| Language | English-primary, Chinese-secondary (bilingual YAML fields) | Reach + accessibility |
| Content splitting | One lesson per `.md` file + chapter index | Lazy Pyodide load per lesson |

---

## 3. Architecture

### 3.1 Runtime diagram

```
┌──────────────────────────────────────────────────────────┐
│ Browser (iOS Safari 16.4+ / Android Chrome 90+)          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ LiaScript runtime (loaded from CDN)               │  │
│  │                                                    │  │
│  │  ┌──────────────┐   ┌────────────────────────┐    │  │
│  │  │ Lesson .md   │   │ CodeEditor (CodeMirror)│    │  │
│  │  │ (YAML + md)  │   │ + Run/Check/Hint btns  │    │  │
│  │  └──────┬───────┘   └──────────┬─────────────┘    │  │
│  │         │                      │                    │  │
│  │         ▼                      ▼                    │  │
│  │  ┌──────────────────────────────────────────┐      │  │
│  │  │ Pyodide (Web Worker)                     │      │  │
│  │  │ - run_code()                             │      │  │
│  │  │ - ast_check(struct_checks)               │      │  │
│  │  │ - capture stdout/stderr                  │      │  │
│  │  │ - 5s hard timeout                        │      │  │
│  │  └──────────────────────────────────────────┘      │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────┐      │  │
│  │  │ ProgressStore (localStorage + JSON I/O)  │      │  │
│  │  └──────────────────────────────────────────┘      │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────┐      │  │
│  │  │ Service Worker (cache lessons + Pyodide) │      │  │
│  │  └──────────────────────────────────────────┘      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          ▲
                          │ fetch .md / manifest.json
                          │
┌──────────────────────────────────────────────────────────┐
│ GitHub Pages (static)                                    │
│  - index.html                                           │
│  - courses/<chapter>/<lesson>.md                        │
│  - manifest.json (course index)                         │
│  - assets/ (Pyodide pre-cache copy)                     │
└──────────────────────────────────────────────────────────┘
                          ▲
                          │ CI: pytest schema validation + Pages build
                          │
┌──────────────────────────────────────────────────────────┐
│ GitHub Actions                                          │
│  - pytest tests/content/ (schema validation)            │
│  - ruff / mypy                                          │
│  - upload artifact → Pages                              │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Lesson file schema

```yaml
---
id: ch01-l01-print
chapter: 1
order: 1
title:
  en: "Your First Program"
  zh: "你的第一个程序"
description:
  en: "Use print() to display text."
  zh: "用 print() 显示文字。"
estimated_minutes: 5
objectives:
  - en: "Write a print statement"
    zh: "编写 print 语句"
starter_code: |
  # Write code below
  ___
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
    must_not_contain: [import, while]
errors:
  SyntaxError:
    en: "Python can't parse your code. Check quotes and colons."
    zh: "Python 无法解析你的代码。检查引号和冒号。"
tts:
  en: "lesson_audio.mp3"
  zh: "lesson_audio_zh.mp3"
---

## {{title}}

Markdown lesson body using LiaScript syntax. Code blocks tagged with
`@LIA.pyodide` are runnable; tagged with `@LIA.eval` get checked.

`@LIA.eval: ["ch01-l01-print"]`
```python
print("Hello, World!")
```
```

### 3.3 Check execution model

Each `checks:` rule compiles to a Python function executed inside Pyodide:

| Kind | Behavior |
|---|---|
| `output` | Run student code; capture stdout; compare to `expected` |
| `ast.must_contain_call` | `ast.parse` → must contain call to named function |
| `ast.must_contain` | Must contain named AST node (e.g. `import`, `class def`) |
| `ast.must_not_contain` | Must NOT contain named AST node |
| `ast.must_define_function` | Must define a function with given name |
| `ast.min_lines` / `ast.max_lines` | Code length bounds |

All checks run within the same 5-second timeout. Output is a JSON: `{passed: bool, errors: [...], hints: [...]}`.

### 3.4 Storage model

```
localStorage["py-tutorial:v1"] = {
  "version": 1,
  "language": "en" | "zh",
  "done": ["ch01-l01-print", ...],
  "current": "ch01-l02-variables",
  "code": {
    "ch01-l01-print": "...",
    "ch01-l02-variables": "..."
  },
  "updated": "2026-09-20T12:34:56Z"
}
```

Export: serialize to JSON file download. Import: validate version + merge with current.

### 3.5 Mobile strategy

- **CSS breakpoints**: ≥360px (smallest phone), ≥768px (tablet), ≥1024px (desktop).
- **CodeMirror**: `font-size: 16px` (avoid iOS zoom), `tab-size: 4`, `line-wrapping: true`, no auto-focus to suppress keyboard.
- **Run button**: sticky at editor bottom, always visible above soft keyboard.
- **Pyodide loading**: lazy on first lesson entry; full-screen progress UI.
- **Memory**: `outputLimit: 10000` lines; stdout truncated at 100KB.
- **Safari iOS specifics**: all Pyodide init triggered by user gesture; service-worker cache-busting via `?v=`; `crossorigin="anonymous"` for Pyodide CDN.

---

## 4. Directory structure

```
python/
├── .github/workflows/
│   ├── ci.yml                  # content validation + lint + test
│   └── deploy.yml              # build & publish to Pages
├── docs/
│   └── superpowers/specs/
│       └── 2026-09-20-python-interactive-tutorial-design.md   # this file
├── content/                    # lesson content (Markdown + YAML)
│   ├── ch01-getting-started/
│   │   ├── 01-hello.md
│   │   ├── 02-variables.md
│   │   └── ...
│   ├── ch02-control-flow/
│   └── ...
├── tests/
│   ├── content/                # pytest: schema validation
│   │   ├── test_schema.py
│   │   ├── test_ast_rules.py
│   │   └── conftest.py
│   ├── runtime/                # Pyodide behavior unit tests
│   │   └── test_checks.py
│   └── e2e/                    # Playwright mobile flow
│       └── lesson_flow.spec.py
├── site/                       # LiaScript entry point
│   ├── index.html              # course home (chapter list)
│   ├── lesson.html             # single-lesson template (?id=xxx)
│   ├── assets/
│   │   ├── manifest.json       # course index (runtime-fetched)
│   │   ├── runtime/
│   │   │   ├── check-runner.js
│   │   │   ├── progress.js
│   │   │   └── pyodide-worker.js
│   │   └── styles/
│   │       ├── mobile.css
│   │       └── theme.css
│   └── service-worker.js
├── scripts/
│   ├── build_manifest.py       # scan content/ → manifest.json
│   └── dev_serve.py            # local dev server
├── pyproject.toml              # uv project
├── .gitignore
├── README.md
└── LICENSE
```

---

## 5. Milestones

Each milestone has explicit acceptance; CI must be green to advance.

| ID | Est. weeks | Title | Acceptance |
|---|---|---|---|
| **M0** | 0.5 | Skeleton + CI | repo structure, pyproject, CI green, Pages serves empty page |
| **M1** | 2 | Runtime MVP | LiaScript loads lesson; Pyodide runs code; Run/Check/Hint/Show Answer; 1 full lesson; localStorage progress; JSON import/export |
| **M2** | 1 | Mobile polish | iOS Safari 16.4 + Android Chrome 90 verified; CodeMirror mobile-tuned; PWA basics; 3-breakpoint responsive |
| **M3** | 2 | Content schema + validation | YAML schema defined; pytest auto-validates; CI blocks merge on schema errors |
| **M4** | 3 | Batch 1 lessons (ch1–3) | ~15 lessons: variables/types, control flow, functions, data structures |
| **M5** | 2 | Batch 2 lessons (ch4–6) | ~15 lessons: OOP/dataclass/type hints/exceptions/testing/modules |
| **M6** | 3 | Batch 3 lessons (ch7–10) | ~20 lessons: file I/O, stdlib, requests, Flask mini-backend, SQLite, pytest |
| **M7** | 1 | Accessibility + wrap | keyboard/screen-reader/contrast audit; README; demo recording |

**Total**: ~12 weeks, ~50–60 lessons (light side of 50–80 midpoint).

> Key dependencies: M3 schema must be stable before M4 batch 1 starts. M1 must produce a working lesson flow before any further content can be validated.

---

## 6. Phase 1 Detailed Plan (M0 + M1)

### 6.1 Scope (In/Out)

**In**:

- Directory structure, `pyproject.toml`, CI passing.
- GitHub Pages deployment of empty page.
- LiaScript loads lesson, Pyodide runs code.
- Run / Check / Hint / Show Answer buttons.
- localStorage progress + JSON import/export.
- 1 complete sample lesson (Hello World).

**Out** (deferred to M2+):

- PWA service worker.
- Schema auto-validation.
- Responsive fine-tuning.
- Bilingual UI.
- Playwright e2e.
- Multiple lessons.

### 6.2 Steps

#### M0 (~half day)

1. Initialize project skeleton with `uv init` + create directory structure per §4.
2. Write `.gitignore` (Python, Node, IDE, OS).
3. Write `README.md` (project description, setup, run).
4. Write `.github/workflows/ci.yml`: lint + test (start empty).
5. Write `.github/workflows/deploy.yml`: build + Pages.
6. Create `site/index.html` with "Hello" placeholder.
7. Verify locally with `python -m http.server`; push and verify Pages serves.
8. **Acceptance**: CI green, Pages publicly reachable.

#### M1 (~2 weeks)

9. Write `site/index.html` real entry: left = lesson list, right = content container; hardcode 1 lesson for now.
10. Pull in LiaScript via CDN; verify `.md` renders.
11. Add `@LIA.pyodide:` code block to lesson; verify Pyodide boots + Run button works.
12. Write `site/assets/runtime/pyodide-worker.js`: Web Worker wrapping Pyodide; expose `run_code(code) → {stdout, stderr, error}`; 5s hard timeout.
13. Write `site/assets/runtime/check-runner.js`:
    - Parse lesson YAML `checks:` field.
    - Expose `run_checks(code, checks) → {passed, errors, hints}`.
    - Implement `output` and `ast` kinds.
14. Add Hint button to lesson UI: each click reveals next hint (DOM manipulation).
15. Add Show Answer button: collapsible solution block.
16. Write `site/assets/runtime/progress.js`:
    - `markDone(lessonId)` writes localStorage.
    - `loadProgress()` reads + renders done list.
    - `exportJSON()` / `importJSON(file)` handle import/export.
17. Write sample lesson `content/ch01-getting-started/01-hello.md` with full schema fields.
18. Add Export/Import buttons in `site/index.html` bound to progress.js.
19. Run the full local flow end-to-end: open → click lesson → write code → Run → Check → fail → Hint → fix → pass → Next → refresh → progress retained → Export → Import.
19. Write 1 pytest `tests/content/test_hello_exists.py` ensuring sample lesson file exists and frontmatter is complete.
20. PR; CI green; merge to `main`; auto-deploy to Pages.
21. **Acceptance**: iOS Safari + Android Chrome both run the full flow on a real device.

### 6.3 Phase 1 Explicit Non-Goals (drift guard)

- No PWA service worker (M2).
- No schema auto-validation (M3).
- No responsive fine-tuning (M2).
- No bilingual UI (M3+).
- No Playwright e2e (M2 simplified to manual).
- No multiple lessons (M4+).

### 6.4 Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| LiaScript × Pyodide integration has rough edges | M1 slip | Use `@LIA.pyodide` native integration; fallback: custom CodeMirror + direct Pyodide |
| Pyodide OOM on mobile | Lesson crash | Cap input size + truncate output + 5s timeout |
| Safari iOS Pyodide compatibility | iOS users blocked | Real-device test early; fallback to read-only lessons |
| GitHub Actions Pages deploy slow | Slow feedback loop | Local `python -m http.server` for dev; CI runs schema/lint only |
| AST checks are fragile | Frequent false negatives | Each AST rule paired with friendly error schema field |

---

## 7. Open Questions / Future Decisions

- Should we ship a "lite" landing page separate from the LiaScript course viewer, or let `index.html` be the LiaScript viewer itself? (Decision deferred to M1 step 9.)
- Locale persistence: store in localStorage? URL `?lang=zh` query? Browser `Accept-Language` header? (Default: localStorage > URL > browser.)
- Quiz blocks (multiple choice) inside LiaScript — include in MVP or later? (Later; lesson page supports free-form only in MVP.)

---

## 8. What This Document Is Not

- Not a full implementation plan with code snippets (that comes from `superpowers:writing-plans` after spec approval).
- Not a content draft — actual lessons are authored separately in `content/`.
- Not a deployment runbook — `docs/deploy.md` (TBD) covers release procedure.
