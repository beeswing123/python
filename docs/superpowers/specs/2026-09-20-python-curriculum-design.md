# Python Curriculum — Complete Spec & Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

A self-paced, AI-tutor-driven curriculum that takes you from "knows some Python basics but with gaps" to **hireable generalist Python developer**. This document is both the design spec and the implementation plan in one — there is no separate plan file.

## Sections

1. [Context](#context)
2. [Goals](#goals)
3. [High-Level Structure](#high-level-structure)
4. [Per-Phase Anatomy](#per-phase-anatomy)
5. [Phase 1 — Foundations Gap-Fill](#phase-1--foundations-gap-fill)
6. [Phase 2 — Core Language Depth](#phase-2--core-language-depth)
7. [Phase 3 — OOP, Testing, Tooling](#phase-3--oop-testing-tooling)
8. [Phase 4 — Web & APIs](#phase-4--web--apis)
9. [Phase 5 — Data & Persistence](#phase-5--data--persistence)
10. [Phase 6 — Async, Performance, Ecosystem](#phase-6--async-performance-ecosystem)
11. [Phase 7 — Polish & Job-Readiness](#phase-7--polish--job-readiness)
12. [AI Tutor Prompt Library](#ai-tutor-prompt-library)
13. [Failure Modes](#failure-modes)
14. [Progress Tracking — `LEARNING.md`](#progress-tracking--learningmd)
15. [Environment & Setup (Phase 0)](#environment--setup-phase-0)
16. [Implementation Plan](#implementation-plan)
    - [Task 1: Phase 0 — Environment & Repository Setup](#task-1-phase-0--environment--repository-setup)
    - [Task 2: Phase 1 — Foundations Gap-Fill](#task-2-phase-1--foundations-gap-fill)
    - [Task 3: Phase 2 — Core Language Depth](#task-3-phase-2--core-language-depth)
    - [Task 4: Phase 3 — OOP, Testing, Tooling](#task-4-phase-3--oop-testing-tooling)
    - [Task 5: Phase 4 — Web & APIs](#task-5-phase-4--web--apis)
    - [Task 6: Phase 5 — Data & Persistence](#task-6-phase-5--data--persistence)
    - [Task 7: Phase 6 — Async, Performance, Ecosystem](#task-7-phase-6--async-performance-ecosystem)
    - [Task 8: Phase 7 — Polish & Job-Readiness](#task-8-phase-7--polish--job-readiness)
17. [How to Use This Document](#how-to-use-this-document)

---

## Context

You want to learn Python from "not complete beginner, but basics are shaky" to **hireable generalist Python developer**, via a self-paced, AI-tutor-driven curriculum. This document is the single source of truth — you execute against it.

The curriculum runs from `/Users/zaili/Desktop/ai/python`. Everything — code, notes, AI tutor prompts, learning log — lives in that repo so the journey itself becomes portfolio material.

### Global Constraints

These apply to every phase and task. Do not deviate without a written reason.

- **Working directory:** `/Users/zaili/Desktop/ai/python`
- **OS / shell:** macOS, zsh (default)
- **Python:** 3.12 or newer (`python3.12 --version` to verify)
- **Package manager:** `uv` (not `pip` directly; not Poetry). Install via `curl -LsSf https://astral.sh/uv/install.sh | sh` if missing.
- **Linting / formatting:** `ruff` (linter + formatter). No `black`, no `flake8`, no `pylint`.
- **Testing:** `pytest`. Coverage target is 90% on capstone code.
- **Types:** `mypy` strict mode on capstone code.
- **Version control:** everything is committed to git. No uncommitted work; meaningful commit messages.
- **AI tutor:** any capable LLM (Claude, GPT-4+, etc.). The prompt library in `prompts/` is what makes it a structured teacher.
- **Pace:** self-paced. No deadlines. Spend a week or three months on a phase.
- **Progress tracking:** `LEARNING.md` is updated at the end of every phase and committed.
- **Spec is authoritative:** if this document and the prompt library disagree, this document wins. Update prompts in that case.

---

## Goals

By the end of the curriculum, you can:

1. Read and explain idiomatic Python (data model, comprehensions, protocols, generators, decorators, context managers).
2. Write a tested, packaged, type-hinted Python module/library with CI.
3. Build a small web service (FastAPI or Flask) with persistence and tests.
4. Use SQL + an ORM, handle errors well, structure a non-trivial codebase.
5. Use async for I/O-bound work, profile hot paths, choose dependencies wisely.
6. Read other people's Python and identify smells / improvements.
7. Have a small portfolio of phase capstone projects.

---

## High-Level Structure

Seven phases, strictly linear with gating. Complete Phase N's exit criteria before starting N+1. Self-paced — a phase can take a week or three months.

| # | Phase | One-line purpose |
|---|-------|------------------|
| 1 | Foundations Gap-Fill | Lock down basics rigorously: types, mutability, control flow, strings, I/O, exceptions, functions, basic stdlib |
| 2 | Core Language Depth | Data model, iteration protocol, comprehensions, modules/packages, packaging, errors, logging |
| 3 | OOP, Testing, Tooling | Classes, dataclasses, protocols, pytest, linters, formatters, pre-commit, git hygiene, CI basics |
| 4 | Web & APIs | HTTP, requests, Flask or FastAPI, REST design, JSON, auth basics, validation, integration tests |
| 5 | Data & Persistence | Files & serialization, SQL, SQLAlchemy ORM, migrations, pandas basics |
| 6 | Async, Performance, Ecosystem | asyncio, concurrency vs parallelism, profiling, popular libs, distribution |
| 7 | Polish & Job-Readiness | Idiomatic style, refactoring, design patterns in Python, code reading, interview-style coding, portfolio curation |

Why a dedicated gap-fill phase 1: you have some Python exposure but the basics are shaky. Without rigorous foundations, intermediate topics (decorators, context managers, async) will keep failing on fundamentals. Phase 1 exists to prevent that.

### File Structure

The repo layout produced by this plan. Created in Task 1, filled in across Tasks 2–8.

```
/Users/zaili/Desktop/ai/python/
├── .git/                                  # created in Task 1
├── .gitignore                             # created in Task 1
├── LEARNING.md                            # created in Task 1, updated every phase
├── README.md                              # created in Task 1, updated over time
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-09-20-python-curriculum-design.md   # this file
├── prompts/                               # already exists with 6 files
│   ├── start-phase.md
│   ├── teach-topic.md
│   ├── review-code.md
│   ├── explain-back.md
│   ├── stuck-helper.md
│   └── phase-retro.md
├── notes/                                 # per-phase notes go here
├── phases/
│   ├── phase-01-foundations/
│   ├── phase-02-core-language/
│   ├── phase-03-oop-testing-tooling/
│   ├── phase-04-web-apis/
│   ├── phase-05-data-persistence/
│   ├── phase-06-async-performance/
│   └── phase-07-polish/
└── portfolio/                             # curated capstones at the end
```

---

## Per-Phase Anatomy

Every phase uses the same six-element template:

1. **AI Tutor Onboarding** — open a fresh AI tutor session using `prompts/start-phase.md`, naming the phase and goals.
2. **Topic Walkthroughs** — for each topic, run `prompts/teach-topic.md` with that topic name. Tutor explains, gives an exercise, reviews your code, quizzes you, refuses to advance until you demonstrate comprehension.
3. **Reading Block** — curated short list (≤3 per topic), read after the walkthrough to deepen. Mix of official docs, one canonical book chapter or blog post, and small real-world code to read.
4. **Phase Exercises** — 5–10 small exercises ordered by difficulty. AI tutor provides them, you submit code, tutor gives feedback.
5. **Capstone Project** — one non-trivial project combining the phase's topics. AI tutor sets requirements, you build it across multiple sessions, tutor reviews at milestones and at completion. Capstones are portfolio-quality.
6. **Exit Criteria** — explicit "you can move on when..." checks. Must all be checked before starting the next phase.

Per-phase sizing guideline: 6–10 topics, 6–10 reading resources total, 5–10 exercises, 1 capstone scoped to roughly 1–3 days of focused work for someone at a normal pace.

---

## Phase 1 — Foundations Gap-Fill

**Goal:** Lock down the basics rigorously so later phases don't keep tripping on fundamentals.

### Topics
1. Values, types, mutability; variables vs names; `id()` vs `==`
2. Numbers, strings, bytes, truthiness, `None`
3. Control flow: `if/elif/else`, `for`, `while`, `match`
4. Functions: positional/keyword args, `*args`/`**kwargs`, scopes, closures, lambdas
5. Exceptions: `try/except/else/finally`, custom exception hierarchies
6. I/O: file modes, `with` statement, `pathlib`, encoding
7. Basic stdlib: `sys`, `os`, `json`, `collections` (Counter, defaultdict)

### Exercises (sample — AI tutor provides the full set)
- Predict mutability behavior across tuples, lists, dicts, frozensets
- Trace reference vs value through a nested data structure
- String formatting drills (`%`, `.format`, f-strings, edge cases)
- Refactor a deeply nested if/elif chain to use `match`
- Implement `map`/`filter`-style helpers from scratch
- Build a robust file parser with custom error types
- Write a log-file tailer that handles log rotation
- Implement a word-frequency analyzer using `collections.Counter`

### Capstone
**CLI expense tracker** with CSV persistence. Must handle malformed rows gracefully (custom exceptions), support add/list/summary commands, use `pathlib` and `argparse`, and be organized into a small package with tests.

### Exit Criteria
- [ ] Can explain Python's name/object model in your own words (variables are names bound to objects; `==` vs `is`; mutable default argument trap)
- [ ] Can write a function with `*args`/`**kwargs` and explain when each is appropriate
- [ ] Can build a custom exception hierarchy and use it to handle a multi-step workflow
- [ ] Capstone passes AI tutor review (correctness, error handling, structure, tests)
- [ ] Phase retro written in `LEARNING.md`

### Reading Block
- *The Python Tutorial* (official docs), sections 3–9
- Ned Batchelder, "Facts and Myths about Python Names and Values" (PyCon talk)
- *Python Distilled* ch. 1–3 (or *Fluent Python* 2e ch. 1 if you don't have *Python Distilled*)

---

## Phase 2 — Core Language Depth

**Goal:** Go from "I can write scripts" to "I understand the language."

### Topics
1. Data model: dunder methods, `__repr__`/`__str__`/`__eq__`/`__hash__`/`__len__`/`__iter__`/`__bool__`
2. Comprehensions (list/dict/set), generator expressions, `yield`, generator delegation
3. Itertools: `chain`, `islice`, `groupby`, `tee`, `combinations`
4. Modules & packages: `__init__.py`, namespace packages, relative imports, `sys.path`
5. Virtual environments, `pip`, dependency declarations, lock files
6. Packaging: `pyproject.toml`, build backends (hatchling/uv), editable installs, source vs wheel
7. Errors as values: EAFP vs LBYL, exception chaining, `contextlib.suppress`
8. Logging: `logging` module, levels, handlers, formatters, structured logging basics

### Capstone
**Markdown-to-HTML converter** with custom data classes (Document, Block, Inline), generator-based streaming for large inputs, proper logging, and a `pyproject.toml` installable as a tool.

### Exit Criteria
- [ ] Can implement `__repr__`/`__eq__`/`__hash__` correctly and explain when each is needed
- [ ] Can choose between list comprehension, generator expression, and `map`/`filter` and justify it
- [ ] Can structure a small package and install it editable with `uv`/`pip`
- [ ] Can configure `logging` with multiple handlers and structured output
- [ ] Capstone passes review
- [ ] Phase retro written

### Reading Block
- David Beazley, "Iterables vs Iterators vs Generators" (talk)
- *Fluent Python* 2e ch. 1–9 (selected sections)
- Official Python Packaging Tutorial

---

## Phase 3 — OOP, Testing, Tooling

**Goal:** Build software, not just scripts.

### Topics
1. Classes & dataclasses, `__post_init__`, immutability (`frozen=True`)
2. Inheritance, mixins, MRO, abstract base classes, protocols (PEP 544, structural typing)
3. Type hints: annotations, generics, `typing.Protocol`, `TYPE_CHECKING`, `mypy` strict mode
4. Testing: `pytest`, fixtures (function/scope), parametrize, markers, coverage, TDD workflow
5. Linting & formatting: `ruff` (linter + formatter), pre-commit hooks
6. Git hygiene: branches, meaningful commits, PRs, code review basics
7. CI basics: GitHub Actions for lint + test on every push

### Capstone
**Library management system** with full `pytest` test suite, type hints checked by `mypy`, `ruff` clean, pre-commit hooks installed, and a GitHub Actions workflow running the lot. Uses protocols for duck-typed interfaces, dataclasses for value objects, and a small custom exception hierarchy.

### Exit Criteria
- [ ] Can decide when to use a class vs a dataclass vs a NamedTuple vs a Protocol and justify it
- [ ] Can write a `pytest` test suite with fixtures and parametrize achieving ≥90% coverage
- [ ] Can configure `mypy` strict mode and `ruff` to keep a project clean
- [ ] Can open and review a PR with constructive feedback
- [ ] CI is green on GitHub
- [ ] Capstone passes review
- [ ] Phase retro written

### Reading Block
- *Fluent Python* 2e ch. 11–13 (interfaces, inheritance, protocols)
- Official `pytest` documentation (good practices, fixtures)
- "Real Python: SOLID Principles in Python" (pragmatic take, not dogmatic)
- `mypy` cheatsheet

---

## Phase 4 — Web & APIs

**Goal:** Build and consume HTTP services.

### Topics
1. HTTP fundamentals: methods, status codes, headers, cookies, content negotiation
2. `requests` library: sessions, retries, timeouts, connection pooling
3. Flask **or** FastAPI (pick FastAPI unless you have a reason): routing, request/response models, dependency injection, error handlers
4. REST design: resources, idempotency, pagination, versioning, error envelopes
5. Auth basics: API keys, JWTs, OAuth2 concepts (don't roll your own crypto)
6. Validation: Pydantic (FastAPI) or Marshmallow (Flask)
7. API testing: `TestClient`, contract tests, mocking external services with `respx` or `httpx-mock`

### Capstone
**Task-management REST API** with: resource design (tasks, projects, users), Pydantic schemas, dependency-injected auth, integration tests with `TestClient`, structured error responses, OpenAPI docs that work, and a simple CLI client that consumes it.

### Exit Criteria
- [ ] Can describe the HTTP request/response cycle and common status codes
- [ ] Can build a CRUD API with FastAPI including validation, auth, and tests
- [ ] Can write integration tests that exercise the API end-to-end
- [ ] Can articulate why you wouldn't roll your own crypto or session management
- [ ] Capstone passes review
- [ ] Phase retro written

### Reading Block
- FastAPI tutorial (official docs)
- *RESTful Web APIs* (Richardson/Amundsen) ch. 1–4
- OWASP API Security Top 10 (overview, not memorization)

---

## Phase 5 — Data & Persistence

**Goal:** Talk to databases and handle data seriously.

### Topics
1. Files & serialization: JSON, CSV, Parquet, pickle (and why not pickle)
2. SQL fundamentals: SELECT/INSERT/UPDATE/DELETE, joins, indexes, transactions, ACID
3. SQLite via `sqlite3` (raw SQL)
4. SQLAlchemy ORM: declarative models, sessions, relationships, eager loading (`selectinload`, `joinedload`)
5. Migrations: Alembic
6. pandas basics: DataFrames, indexing, groupby, merge; when pandas is overkill (small data → stdlib is fine)
7. Connection pooling, query performance, N+1 problem

### Capstone
**Bookmarks service**: SQLite + SQLAlchemy + a small REST API + integration tests + Alembic migrations from day one. Must demonstrate eager loading, transaction handling, and at least one migration that adds a column.

### Exit Criteria
- [ ] Can write SQL with joins, indexes, and transactions by hand
- [ ] Can design a SQLAlchemy model with relationships and choose eager-loading strategy
- [ ] Can create and apply Alembic migrations, including a non-trivial one
- [ ] Can articulate the N+1 problem and fix it
- [ ] Can decide when to use pandas vs stdlib vs raw SQL
- [ ] Capstone passes review
- [ ] Phase retro written

### Reading Block
- Mode Analytics SQL tutorial (or *Use The Index, Luke!* for indexing deep-dive)
- SQLAlchemy ORM tutorial (official)
- Pandas official getting-started
- "When to Use Pandas" (realpython.com)

---

## Phase 6 — Async, Performance, Ecosystem

**Goal:** Make Python work in modern environments.

### Topics
1. `asyncio`: event loop, `await` semantics, tasks, gather, exception groups (`ExceptionGroup`)
2. Concurrency vs parallelism: threads (`threading`), processes (`multiprocessing`), when to use which
3. `httpx` async client, async DB drivers (e.g., `asyncpg`, `aiosqlite`), async testing
4. Profiling: `cProfile`, `timeit`, `py-spy` (sampling profiler), `memray` (memory)
5. Choosing dependencies: maintenance health signals, license, footprint, API quality, transitive deps
6. Distribution: build a wheel/sdist, publish to TestPyPI
7. Common libraries worth knowing: `click` (CLIs), `pydantic`, `rich`, `tenacity` (retries), `structlog` (logging), `polars` (fast DataFrames)

### Capstone
**Async web scraper** that fetches many URLs concurrently with rate limits, retries via `tenacity`, structured output to JSON Lines, and a `py-spy` profile showing the I/O-bound nature of the workload. Include a small CLI built with `click`. Publish to TestPyPI.

### Exit Criteria
- [ ] Can write an `async`/`await` function and reason about when it actually helps
- [ ] Can pick threads vs processes vs async for a given workload and justify it
- [ ] Can profile a Python program with `py-spy` and act on what it shows
- [ ] Can evaluate a library's quality/maintenance before adopting it
- [ ] Can publish a package to TestPyPI
- [ ] Capstone passes review
- [ ] Phase retro written

### Reading Block
- *Fluent Python* 2e ch. 20–22 (concurrency)
- "Speed Up Your Python Program With Concurrency" (realpython.com)
- `py-spy` documentation
- "How to Choose a Python Library" (calmcode.io)

---

## Phase 7 — Polish & Job-Readiness

**Goal:** Become the kind of Python developer people want to hire.

### Topics
1. Idiomatic style: PEP 8, naming, "Pythonic" patterns (EAFP, duck typing, composition over inheritance)
2. Refactoring: extract function/class, replace conditional with polymorphism, simplify conditionals, rename for clarity
3. Design patterns in Python: composition over inheritance, dependency injection, strategy, observer — only where they fit naturally, never for their own sake
4. Reading code: pick 2 small open-source projects, read, write notes
5. Interview-style coding: timed exercises, communication, articulating trade-offs
6. Portfolio curation: 3–5 best capstones, polished READMEs, hosted on GitHub

### Capstone
**Portfolio package**: refactor 2 prior capstones, write README per project (problem, design, how to run, what you learned), record a 5-minute walkthrough of one. Plus a code-reading report on 2 small OSS projects (chosen in collaboration with the AI tutor).

### Exit Criteria
- [ ] Can read unfamiliar Python and identify smells / improvements
- [ ] Can refactor a 100-line script into well-named functions/classes without changing behavior (tests prove it)
- [ ] Can articulate 3 patterns you've used and why they fit (or didn't)
- [ ] Portfolio is on GitHub with READMEs
- [ ] Code-reading report written
- [ ] Phase retro written

### Reading Block
- *Effective Python* 2e (90 items — cherry-pick the unfamiliar ones, don't read cover-to-cover)
- "How to Read Code" (irt.org)
- Browse r/learnpython "Portfolio Project Ideas" for inspiration, not gospel

---

## AI Tutor Prompt Library

The prompt library lives in `prompts/` as six copy-pasteable Markdown files. Each one is a single page with light templating (`{{phase}}`, `{{topic}}`). Contents are summarized below; the files themselves contain the full prompt text.

- **`prompts/start-phase.md`** — opens a phase, names goals, asks tutor to teach the first topic and quiz before moving on.
- **`prompts/teach-topic.md`** — "teach me `{{topic}}` for Phase `{{phase}}`, quiz me, don't move on until I get it." Templated per topic.
- **`prompts/review-code.md`** — "review this code for Phase `{{phase}}` goals: correctness, style, edge cases, tests." Paste code in your message.
- **`prompts/explain-back.md`** — "I just learned `{{topic}}`; quiz me with edge cases and gotchas."
- **`prompts/stuck-helper.md`** — "I'm stuck on `{{problem}}`; give me a hint ladder, not the answer."
- **`prompts/phase-retro.md`** — "I finished Phase `{{phase}}`; help me write a retro and check exit criteria."

**Why this matters:** Without the prompt library, learners drift — they ask vague questions, get vague answers, and the AI tutor becomes a generic assistant. Prompts keep it on rails as a structured teacher.

---

## Failure Modes

| Symptom | Response |
|---------|----------|
| Stuck on a topic for >2 sessions | Use `stuck-helper.md`. Try the hint ladder (3 hints before asking for the answer). If still stuck, switch reading resource. If still stuck, skip and circle back later. |
| AI tutor drifts or gives hand-wavy answers | Restart the conversation with the canonical prompt for that topic. Don't continue a drifted session. |
| Can't pass exit criteria after multiple attempts | The phase is telling you a prerequisite is missing. Write a short note on what's fuzzy; ask the tutor to diagnose. Most often this means revisiting an earlier phase's topic. |
| Burnout or momentum loss | Self-paced — pause between phases or mid-phase. Resume protocol: re-read your last retro, run `start-phase.md`, continue. |
| Phase feels boring | Try doing the capstone first. Motivation often kicks in once you see what the phase is building toward. If still boring, talk to the tutor about compressing — but don't skip exit criteria. |
| Want to skip ahead because you already know it | Do the exit criteria exercises as a quick self-test. If you pass cleanly, you can compress or skip. If anything is fuzzy, do the walkthrough. |

---

## Progress Tracking — `LEARNING.md`

A single Markdown file at the repo root, used as the learning log. Format:

```markdown
# Phase <N>: <name>
Status: in-progress | done
Started: <date>
Ended: <date>

## Topics completed
- [x] Topic A — <date>, retro: <one line>
- [x] Topic B — <date>, retro: <one line>
- [ ] Topic C

## Capstone
- Status: not started | in progress | done
- Repo: <github link or local path>
- Notes: <what you built, what was hard>

## Exit criteria
- [ ] Can explain X
- [ ] Capstone passes review
- [ ] Retro written
```

**Why a file, not a notebook app:** It lives next to code, it's greppable, it commits to git (a learning journal in your own history is itself portfolio material), and writing retros is one of the highest-leverage learning activities.

---

## Environment & Setup (Phase 0)

Working directory: `/Users/zaili/Desktop/ai/python`

### One-time setup
- Python 3.12+ (latest stable). Use `pyenv` or the system Python 3.12 on macOS.
- `git init` in the working directory — the whole curriculum lives in here.
- Editor: VS Code with Python extension **or** PyCharm Community.
- Terminal: zsh (macOS default) — fine as is.

### Installed once, used in many phases
- `uv` (fast package manager; preferred over pip+venv in 2026). Manages per-phase virtualenvs.
- `git`, `gh` (GitHub CLI for portfolio)
- `ruff` (linter + formatter)
- `pytest`
- `mypy`

### Per-phase setup
Each phase gets its own subfolder under `phases/` with a `pyproject.toml` (managed by `uv`) and its own venv. Dependencies stay isolated.

---

## Implementation Plan

This is the execution half of the document. The first 8 tasks below correspond to Phase 0 (setup) and Phases 1–7 (the seven learning phases). Steps use checkboxes so you can track progress.

---

### Task 1: Phase 0 — Environment & Repository Setup

**Files:**
- Create: `/Users/zaili/Desktop/ai/python/.gitignore`
- Create: `/Users/zaili/Desktop/ai/python/README.md`
- Create: `/Users/zaili/Desktop/ai/python/LEARNING.md`
- Create: `/Users/zaili/Desktop/ai/python/notes/.gitkeep`
- Create: `/Users/zaili/Desktop/ai/python/phases/.gitkeep`
- Create: `/Users/zaili/Desktop/ai/python/portfolio/.gitkeep`

**Goal:** One-time setup. After this task, you have a clean repo, the right tools, the folder structure, and a learning log skeleton.

- [ ] **Step 1.1: Verify Python and install uv**

Run: `python3.12 --version`
Expected: `Python 3.12.x` or newer. If missing, install via `brew install python@3.12` or `pyenv install 3.12`.

Run: `which uv || curl -LsSf https://astral.sh/uv/install.sh | sh`
Expected: `uv` is on `PATH`. Confirm with `uv --version`.

- [ ] **Step 1.2: Initialize git repository**

```bash
cd /Users/zaili/Desktop/ai/python
git init
git branch -M main
```

- [ ] **Step 1.3: Create `.gitignore`**

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
.venv/
venv/
env/
.env
.env.local

# uv
.uv-cache/

# Testing / coverage
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store

# Per-phase artifacts (keep folders, ignore their contents)
phases/*/dist/
phases/*/build/
phases/*/*.egg-info/
```

- [ ] **Step 1.4: Create `README.md`**

```markdown
# Python Learning Journey

Self-paced, AI-tutor-driven curriculum. This document is the single source of truth.

- **Spec & Plan:** `docs/superpowers/specs/2026-09-20-python-curriculum-design.md`
- **Learning log:** `LEARNING.md`
- **Prompt library:** `prompts/`

## Setup
Already done if you can read this. See Task 1 of the plan.

## Working through a phase
1. Open `prompts/start-phase.md`, fill in the placeholders, paste into your AI tutor.
2. Use `prompts/teach-topic.md` for each topic.
3. Use `prompts/review-code.md` after writing any code.
4. Use `prompts/explain-back.md` to verify understanding.
5. Use `prompts/stuck-helper.md` when stuck.
6. Use `prompts/phase-retro.md` at the end of each phase.
7. Update `LEARNING.md` and commit.
```

- [ ] **Step 1.5: Create `LEARNING.md` skeleton**

```markdown
# Learning Log

## Overview
- Started: YYYY-MM-DD
- Goal: Generalist / job-ready Python developer
- Working directory: /Users/zaili/Desktop/ai/python

## Phases
- [ ] Phase 1 — Foundations Gap-Fill
- [ ] Phase 2 — Core Language Depth
- [ ] Phase 3 — OOP, Testing, Tooling
- [ ] Phase 4 — Web & APIs
- [ ] Phase 5 — Data & Persistence
- [ ] Phase 6 — Async, Performance, Ecosystem
- [ ] Phase 7 — Polish & Job-Readiness

## Per-phase details
(Replace this comment when you start Phase 1.)

<!--
Template per phase:

# Phase <N>: <name>
Status: in-progress | done
Started: <date>
Ended: <date>

## Topics completed
- [x] Topic A — <date>, retro: <one line>
- [ ] Topic B

## Capstone
- Status: not started | in progress | done
- Repo: <link or local path>
- Notes: <what you built, what was hard>

## Exit criteria
- [ ] Can explain X
- [ ] Capstone passes review
- [ ] Retro written
-->
```

- [ ] **Step 1.6: Create the folder placeholders**

```bash
mkdir -p notes phases portfolio
touch notes/.gitkeep phases/.gitkeep portfolio/.gitkeep
```

- [ ] **Step 1.7: First commit**

```bash
git add .gitignore README.md LEARNING.md docs/ prompts/ notes/ phases/ portfolio/
git status
git commit -m "chore: phase 0 setup — repo, spec, prompts, learning log skeleton"
```

Expected: clean working tree.

- [ ] **Step 1.8: Verify the prompts folder is intact**

Run: `ls /Users/zaili/Desktop/ai/python/prompts/`
Expected: the six prompt files (`start-phase.md`, `teach-topic.md`, `review-code.md`, `explain-back.md`, `stuck-helper.md`, `phase-retro.md`).

Done criteria: clean repo on `main`, all folders created, `LEARNING.md` ready, `uv` and Python 3.12+ available, prompts folder intact. Ready to start Phase 1.

---

### Task 2: Phase 1 — Foundations Gap-Fill

**Files:**
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-01-foundations/pyproject.toml`
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-01-foundations/README.md`
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-01-foundations/expense_tracker/` (capstone)

**Goal:** Lock down the basics rigorously so later phases don't keep tripping on fundamentals. Build a CLI expense tracker capstone.

**Spec reference:** [Phase 1 — Foundations Gap-Fill](#phase-1--foundations-gap-fill) section above.

### Setup

- [ ] **Step 2.1: Create the phase folder and Python project**

```bash
mkdir -p /Users/zaili/Desktop/ai/python/phases/phase-01-foundations
cd /Users/zaili/Desktop/ai/python/phases/phase-01-foundations
uv init --package expense_tracker
cd expense_tracker
uv add pytest ruff mypy
```

Expected: a `pyproject.toml` and a `src/expense_tracker/` package scaffolded by `uv`.

### Walk through topics


Open `prompts/start-phase.md`, replace placeholders:
- `{{phase}}` = `1`
- `{{phase_name}}` = `Foundations Gap-Fill`
- `{{phase_goal}}` = the Phase 1 goal sentence from the spec
- Topic list = the 7 topics from the spec, in order

Paste into your AI tutor. From here, the tutor drives the conversation.

- [ ] **Step 2.3: For each of the 7 topics, do the following**

For each topic in the Phase 1 spec topic list:

1. Open `prompts/teach-topic.md`, fill `{{topic}}` and `{{phase}}`, paste into the tutor.
2. Work the exercise the tutor gives you. Save your code under `phases/phase-01-foundations/expense_tracker/src/expense_tracker/` in a sensibly-named module.
3. After the tutor marks the topic done, open `prompts/explain-back.md`, paste into the tutor. Answer the four questions it asks. If shaky, drill until solid.
4. Append a one-line retro to `LEARNING.md` under the Phase 1 section.

- [ ] **Step 2.4: Read the assigned reading block**

From the spec, read:
- *The Python Tutorial* (official docs), sections 3–9
- Ned Batchelder, "Facts and Myths about Python Names and Values"
- *Python Distilled* ch. 1–3 (or *Fluent Python* 2e ch. 1)

Take brief notes in `notes/phase-01.md`. Commit notes after each reading.

### Capstone

- [ ] **Step 2.5: Build the CLI expense tracker**

Spec for the capstone (from the spec, restated for execution):
- CLI with `add`, `list`, `summary` subcommands (use `argparse`).
- CSV persistence via `pathlib` (don't hardcode paths; resolve from a sensible default location).
- Custom exception hierarchy for malformed CSV rows.
- Graceful error messages to stderr; nonzero exit on errors.
- Organized into a small package (`src/expense_tracker/`) with at least 3 modules.
- Tests under `tests/` using `pytest`, ≥80% coverage for this phase.

Steps:

1. Pick the **first** module (e.g., the CSV parser) and write tests first. Use `prompts/review-code.md` on your tests before implementing.
2. Implement the module to make the tests pass.
3. Move to the next module. Repeat until all three modules are tested and working.
4. Wire the CLI together; add an integration test that exercises `add` then `list`.
5. Run `ruff check . && ruff format .` and `mypy src/` until both are clean.
6. Run `pytest --cov=src` and confirm coverage.

- [ ] **Step 2.6: Capstone review with AI tutor**

Open `prompts/review-code.md`, fill in `{{phase}}` = `1` and `{{phase_goal}}`, paste the full capstone source. Iterate on REQUEST CHANGES until verdict is APPROVE.

### Exit gate

- [ ] **Step 2.7: Run the phase retro**

Open `prompts/phase-retro.md`, fill in the placeholders, paste into the tutor. Write the retro into `LEARNING.md` under Phase 1.

- [ ] **Step 2.8: Verify exit criteria from the spec**

Walk through the Phase 1 exit criteria checklist from the spec. For each, do the actual test (not "I think I know it"):

- [ ] Can explain the name/object model in your own words. Try it now — open a blank document and write 5 sentences without consulting any reference. If you can't, revisit topic 1.
- [ ] Can write a function with `*args`/`**kwargs` and justify when each fits. Open a fresh file and write one.
- [ ] Can build a custom exception hierarchy and use it in a multi-step workflow. The capstone already does this — can you explain each layer?
- [ ] Capstone passes AI tutor review (verdict APPROVE from Step 2.6).
- [ ] Retro is written.

- [ ] **Step 2.9: Update LEARNING.md and commit**

Update `LEARNING.md`:
- Mark Phase 1 status: done.
- Fill in Started/Ended dates.
- Topics checklist should be 7/7 done.
- Capstone section: status done, repo path, 1-2 line notes.

```bash
git add phases/phase-01-foundations/ notes/ LEARNING.md
git commit -m "feat(phase-1): foundations gap-fill complete — CLI expense tracker capstone"
```

Done criteria: 7/7 topics done, capstone passing review with ≥80% coverage, exit criteria all checked, `LEARNING.md` updated, commit made. Move to Task 3.

---

### Task 3: Phase 2 — Core Language Depth

**Files:**
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-02-core-language/` (full phase scaffold)
- Create: capstone project (markdown-to-HTML converter) under `phases/phase-02-core-language/md2html/`

**Goal:** Go from "I can write scripts" to "I understand the language." Build a markdown-to-HTML converter capstone.

**Spec reference:** [Phase 2 — Core Language Depth](#phase-2--core-language-depth) section above.

### Setup

- [ ] **Step 3.1: Create the phase project**

```bash
mkdir -p /Users/zaili/Desktop/ai/python/phases/phase-02-core-language
cd /Users/zaili/Desktop/ai/python/phases/phase-02-core-language
uv init --package md2html
cd md2html
uv add pytest ruff mypy
```

### Walk through topics

- [ ] **Step 3.2: Start the phase**

Open `prompts/start-phase.md`, fill in the Phase 2 details from the spec, paste into the tutor.

- [ ] **Step 3.3: For each of the 8 topics (data model → logging), teach → exercise → explain-back**

Same pattern as Phase 1 Step 2.3. Save code under `phases/phase-02-core-language/md2html/src/md2html/`. Append retro lines to `LEARNING.md`.

- [ ] **Step 3.4: Read the assigned reading block**

Read the three resources from the Phase 2 reading block in the spec. Notes in `notes/phase-02.md`.

### Capstone

- [ ] **Step 3.5: Build the markdown-to-HTML converter**

Spec for the capstone:
- Custom data classes for `Document`, `Block`, `Inline`.
- Generator-based streaming for large inputs (don't load whole file into memory).
- Proper `logging` configuration (file + stderr handlers, structured format).
- `pyproject.toml` installable as a tool (`md2html INPUT.md OUTPUT.html`).
- Tests under `tests/`, ≥85% coverage.

TDD approach: tests first (use `prompts/review-code.md` on the tests), then implement. `ruff check && ruff format && mypy src && pytest --cov=src` all green before review.

- [ ] **Step 3.6: Capstone review with AI tutor**

`prompts/review-code.md` with full source. Iterate to APPROVE.

### Exit gate

- [ ] **Step 3.7: Phase retro**

`prompts/phase-retro.md`. Write retro into `LEARNING.md`.

- [ ] **Step 3.8: Verify Phase 2 exit criteria from the spec**

For each of the 6 Phase 2 exit criteria in the spec, demonstrate it now (write the code / explain it / check the test). Be honest with yourself — if any are fuzzy, revisit the topic.

- [ ] **Step 3.9: Update LEARNING.md and commit**

```bash
git add phases/phase-02-core-language/ notes/ LEARNING.md
git commit -m "feat(phase-2): core language depth complete — md2html converter capstone"
```

Done criteria: 8/8 topics, capstone passing review ≥85% coverage, exit criteria verified, commit made. Move to Task 4.

---

### Task 4: Phase 3 — OOP, Testing, Tooling

**Files:**
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-03-oop-testing-tooling/` (full scaffold)
- Create: capstone project (library management system)
- Create: `.github/workflows/ci.yml` (CI)

**Goal:** Build software, not just scripts. Library management system with full test suite, types, lint, and CI.

**Spec reference:** [Phase 3 — OOP, Testing, Tooling](#phase-3--oop-testing-tooling) section above.

### Setup

- [ ] **Step 4.1: Create the phase project**

```bash
mkdir -p /Users/zaili/Desktop/ai/python/phases/phase-03-oop-testing-tooling
cd /Users/zaili/Desktop/ai/python/phases/phase-03-oop-testing-tooling
uv init --package library_system
cd library_system
uv add pytest pytest-cov ruff mypy
```

### Walk through topics

- [ ] **Step 4.2: Start the phase**

`prompts/start-phase.md` with Phase 3 details.

- [ ] **Step 4.3: For each of the 7 topics, teach → exercise → explain-back**

Topics in order: classes/dataclasses → inheritance/protocols → type hints/mypy → pytest → ruff/pre-commit → git/PRs → CI. Code under `phases/phase-03-oop-testing-tooling/library_system/src/library_system/`. Update `LEARNING.md` after each.

- [ ] **Step 4.4: Set up pre-commit and CI alongside the topics**

```bash
uv run pre-commit init-templated ruff -t pre-commit
```

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install uv
      - run: uv sync --all-extras
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run mypy src
      - run: uv run pytest --cov=src --cov-fail-under=90
```

- [ ] **Step 4.5: Read the assigned reading block**

Read the four resources from the Phase 3 reading block. Notes in `notes/phase-03.md`.

### Capstone

- [ ] **Step 4.6: Build the library management system**

Spec recap:
- Full `pytest` test suite with fixtures and parametrize.
- Type hints checked by `mypy` strict mode.
- `ruff check` and `ruff format` clean.
- Pre-commit hooks installed and passing.
- GitHub Actions workflow running on every push (already created in Step 4.4).
- Uses protocols for duck-typed interfaces, dataclasses for value objects, custom exception hierarchy.
- ≥90% coverage.

TDD throughout. Use `prompts/review-code.md` after each module.

- [ ] **Step 4.7: Capstone review**

`prompts/review-code.md` to APPROVE.

### Exit gate

- [ ] **Step 4.8: Phase retro**

`prompts/phase-retro.md`. Update `LEARNING.md`.

- [ ] **Step 4.9: Verify Phase 3 exit criteria**

7 criteria per the spec. Verify each, especially CI green on GitHub (push to a GitHub repo and confirm).

- [ ] **Step 4.10: Update LEARNING.md and commit**

```bash
git add phases/phase-03-oop-testing-tooling/ notes/ LEARNING.md
git commit -m "feat(phase-3): OOP, testing, tooling complete — library system capstone with CI"
```

Done criteria: 7/7 topics, capstone ≥90% coverage, CI green on GitHub, exit criteria verified, commit made. Move to Task 5.

---

### Task 5: Phase 4 — Web & APIs

**Files:**
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-04-web-apis/` (full scaffold)
- Create: capstone (task-management REST API)

**Goal:** Build and consume HTTP services. Build a task-management REST API with FastAPI.

**Spec reference:** [Phase 4 — Web & APIs](#phase-4--web--apis) section above.

### Setup

- [ ] **Step 5.1: Create the phase project**

```bash
mkdir -p /Users/zaili/Desktop/ai/python/phases/phase-04-web-apis
cd /Users/zaili/Desktop/ai/python/phases/phase-04-web-apis
uv init --package task_api
cd task_api
uv add fastapi uvicorn pytest httpx ruff mypy
```

### Walk through topics

- [ ] **Step 5.2: Start the phase**

`prompts/start-phase.md` with Phase 4 details.

- [ ] **Step 5.3: For each of the 7 topics, teach → exercise → explain-back**

Topics in order: HTTP fundamentals → `requests` → FastAPI → REST design → auth basics → Pydantic validation → API testing. Code under `phases/phase-04-web-apis/task_api/src/task_api/`. Update `LEARNING.md`.

- [ ] **Step 5.4: Read the assigned reading block**

Three resources from the spec. Notes in `notes/phase-04.md`.

### Capstone

- [ ] **Step 5.5: Build the task-management REST API**

Spec recap:
- Resource design: tasks, projects, users.
- Pydantic schemas (request + response).
- Dependency-injected auth (API key or JWT — pick one and justify).
- `TestClient` integration tests covering at least the happy path + 2 error paths.
- Structured error responses (consistent error envelope).
- Working OpenAPI docs at `/docs`.
- Simple CLI client in the same package that consumes the API.
- ≥85% coverage.

TDD: tests first, then implementation. Use `prompts/review-code.md` after each module.

- [ ] **Step 5.6: Capstone review**

`prompts/review-code.md` to APPROVE.

### Exit gate

- [ ] **Step 5.7: Phase retro**

`prompts/phase-retro.md`. Update `LEARNING.md`.

- [ ] **Step 5.8: Verify Phase 4 exit criteria**

6 criteria per the spec. Verify each.

- [ ] **Step 5.9: Update LEARNING.md and commit**

```bash
git add phases/phase-04-web-apis/ notes/ LEARNING.md
git commit -m "feat(phase-4): web & APIs complete — task management REST API capstone"
```

Done criteria: 7/7 topics, capstone ≥85% coverage with passing review, exit criteria verified, commit made. Move to Task 6.

---

### Task 6: Phase 5 — Data & Persistence

**Files:**
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-05-data-persistence/` (full scaffold)
- Create: capstone (bookmarks service)

**Goal:** Talk to databases and handle data seriously. Build a bookmarks service with SQLite, SQLAlchemy, REST API, and migrations.

**Spec reference:** [Phase 5 — Data & Persistence](#phase-5--data--persistence) section above.

### Setup

- [ ] **Step 6.1: Create the phase project**

```bash
mkdir -p /Users/zaili/Desktop/ai/python/phases/phase-05-data-persistence
cd /Users/zaili/Desktop/ai/python/phases/phase-05-data-persistence
uv init --package bookmarks
cd bookmarks
uv add fastapi uvicorn sqlalchemy alembic aiosqlite pytest httpx ruff mypy
```

### Walk through topics

- [ ] **Step 6.2: Start the phase**

`prompts/start-phase.md` with Phase 5 details.

- [ ] **Step 6.3: For each of the 7 topics, teach → exercise → explain-back**

Topics in order: files/serialization → SQL fundamentals → raw SQLite → SQLAlchemy ORM → Alembic → pandas basics → pooling/N+1. Code under `phases/phase-05-data-persistence/bookmarks/src/bookmarks/`. Update `LEARNING.md`.

- [ ] **Step 6.4: Read the assigned reading block**

Four resources from the spec. Notes in `notes/phase-05.md`.

### Capstone

- [ ] **Step 6.5: Build the bookmarks service**

Spec recap:
- SQLite + SQLAlchemy.
- Small REST API for CRUD on bookmarks.
- Integration tests with `TestClient`.
- Alembic migrations from day one (initial migration + at least one later migration that adds a column).
- Demonstrate eager loading (`selectinload` or `joinedload`) on at least one relationship.
- Explicit transaction handling for write operations.
- ≥85% coverage.

TDD; tests first. Use `prompts/review-code.md` after each module.

- [ ] **Step 6.6: Capstone review**

`prompts/review-code.md` to APPROVE.

### Exit gate

- [ ] **Step 6.7: Phase retro**

`prompts/phase-retro.md`. Update `LEARNING.md`.

- [ ] **Step 6.8: Verify Phase 5 exit criteria**

7 criteria per the spec. Verify each.

- [ ] **Step 6.9: Update LEARNING.md and commit**

```bash
git add phases/phase-05-data-persistence/ notes/ LEARNING.md
git commit -m "feat(phase-5): data & persistence complete — bookmarks service capstone"
```

Done criteria: 7/7 topics, capstone ≥85% coverage, migrations working, exit criteria verified, commit made. Move to Task 7.

---

### Task 7: Phase 6 — Async, Performance, Ecosystem

**Files:**
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-06-async-performance/` (full scaffold)
- Create: capstone (async web scraper)
- Publish: capstone to TestPyPI

**Goal:** Make Python work in modern environments. Build an async web scraper published to TestPyPI.

**Spec reference:** [Phase 6 — Async, Performance, Ecosystem](#phase-6--async-performance-ecosystem) section above.

### Setup

- [ ] **Step 7.1: Create the phase project**

```bash
mkdir -p /Users/zaili/Desktop/ai/python/phases/phase-06-async-performance
cd /Users/zaili/Desktop/ai/python/phases/phase-06-async-performance
uv init --package async_scraper
cd async_scraper
uv add httpx tenacity click structlog py-spy memray pandas polars ruff mypy pytest pytest-asyncio
uv add --dev pytest pytest-asyncio
```

### Walk through topics

- [ ] **Step 7.2: Start the phase**

`prompts/start-phase.md` with Phase 6 details.

- [ ] **Step 7.3: For each of the 7 topics, teach → exercise → explain-back**

Topics in order: asyncio → threads vs processes vs async → httpx async client → profiling (cProfile, py-spy, memray) → choosing dependencies → packaging/distribution → common libraries (click, pydantic, rich, tenacity, structlog, polars). Update `LEARNING.md`.

- [ ] **Step 7.4: Read the assigned reading block**

Four resources from the spec. Notes in `notes/phase-06.md`.

### Capstone

- [ ] **Step 7.5: Build the async web scraper**

Spec recap:
- Fetches many URLs concurrently with rate limits and retries via `tenacity`.
- Structured output to JSON Lines.
- `py-spy` profile showing the I/O-bound nature of the workload.
- Small CLI built with `click` (`async-scraper fetch --urls urls.txt --out out.jsonl`).
- Published to TestPyPI.

TDD: tests with `pytest-asyncio` and a mocked HTTP layer. Use `prompts/review-code.md` after each module.

- [ ] **Step 7.6: Capstone review**

`prompts/review-code.md` to APPROVE.

- [ ] **Step 7.7: Publish to TestPyPI**

```bash
uv build
uv publish --publish-url https://test.pypi.org/legacy/
```

(Create a TestPyPI account first at https://test.pypi.org if you don't have one; configure with `uv auth login --publish-url https://test.pypi.org/legacy/`.)

### Exit gate

- [ ] **Step 7.8: Phase retro**

`prompts/phase-retro.md`. Update `LEARNING.md`.

- [ ] **Step 7.9: Verify Phase 6 exit criteria**

7 criteria per the spec. Verify each.

- [ ] **Step 7.10: Update LEARNING.md and commit**

```bash
git add phases/phase-06-async-performance/ notes/ LEARNING.md
git commit -m "feat(phase-6): async, performance, ecosystem complete — async scraper published to TestPyPI"
```

Done criteria: 7/7 topics, capstone published to TestPyPI, exit criteria verified, commit made. Move to Task 8.

---

### Task 8: Phase 7 — Polish & Job-Readiness

**Files:**
- Create: `/Users/zaili/Desktop/ai/python/phases/phase-07-polish/` (scaffold, may be lighter than other phases)
- Create: `/Users/zaili/Desktop/ai/python/portfolio/` (final curated capstones)
- Modify: `/Users/zaili/Desktop/ai/python/README.md` (final portfolio writeup)

**Goal:** Become the kind of Python developer people want to hire. Polish prior capstones, write READMEs, do code-reading report.

**Spec reference:** [Phase 7 — Polish & Job-Readiness](#phase-7--polish--job-readiness) section above.

### Walk through topics

- [ ] **Step 8.1: Start the phase**

`prompts/start-phase.md` with Phase 7 details.

- [ ] **Step 8.2: For each of the 6 topics, teach → exercise → explain-back**

Topics in order: idiomatic style → refactoring → design patterns in Python → reading code → interview-style coding → portfolio curation. Update `LEARNING.md`.

- [ ] **Step 8.3: Read the assigned reading block**

Three resources from the spec. Notes in `notes/phase-07.md`.

### Capstone

- [ ] **Step 8.4: Pick 2 prior capstones to refactor**

Choose from Phases 4–6 capstones (most complex). For each:
1. Refactor for clarity — better names, smaller functions, idiomatic patterns.
2. Add a `README.md` to the project (problem, design, how to run, what you learned).
3. Add a `tests/` pass proving behavior didn't change.

Use `prompts/review-code.md` on each refactor.

- [ ] **Step 8.5: Code-reading report**

Pick 2 small open-source projects (ask the tutor for suggestions given your interests). Read each. Write a short report (`notes/code-reading-report.md`) covering: what they do, what you learned, what you'd do differently.

- [ ] **Step 8.6: Record a 5-minute walkthrough**

Pick one capstone. Record yourself (or write a script + slides) walking through it: problem, design decisions, what you'd improve. Save as `portfolio/walkthrough.md` (script + key slides; audio optional).

- [ ] **Step 8.7: Curate the portfolio**

Copy your 3–5 best capstones into `/Users/zaili/Desktop/ai/python/portfolio/`. Each must have a clean `README.md`, passing tests, and `ruff`/`mypy` clean.

- [ ] **Step 8.8: Final `README.md` update at the repo root**

Update `/Users/zaili/Desktop/ai/python/README.md` to be a portfolio overview: who you are (one paragraph), what you built (links to portfolio projects), how to run things, what you learned.

### Exit gate

- [ ] **Step 8.9: Phase retro**

`prompts/phase-retro.md`. Update `LEARNING.md` — final phase marked done.

- [ ] **Step 8.10: Verify Phase 7 exit criteria**

6 criteria per the spec. Verify each.

- [ ] **Step 8.11: Update LEARNING.md and final commit**

```bash
git add phases/phase-07-polish/ notes/ portfolio/ README.md LEARNING.md
git commit -m "feat(phase-7): polish & job-readiness complete — portfolio curated"
```

- [ ] **Step 8.12: Optional — push everything to GitHub**

If you want a public portfolio:
```bash
gh repo create python-journey --public --source=. --push
```

Done criteria: all 7 phases marked done in `LEARNING.md`, portfolio curated, READMEs polished, exit criteria verified, final commit made. Curriculum complete.

---

## How to Use This Document

1. **First time:** read this document end-to-end (~30 min) to internalize the shape.
2. **Start Phase 0:** go to Task 1 and execute step by step.
3. **For each phase:** go to that phase's section in this doc for the design + topics + capstone, then go to the matching Task (Task 2 for Phase 1, etc.) for execution steps.
4. **Use the prompt library** (`prompts/*.md`) as the structured interface to your AI tutor.
5. **Track progress** in `LEARNING.md` — update at the end of every phase, commit.
6. **Self-pacing is fine.** Spend a week or three months on a phase. The spec and plan don't change; your pace does.

---

## What Is *Not* in This Document

- The actual exercises & capstones' code — generated by the AI tutor at runtime using the prompts, so they stay fresh and adapt to your pace.
- Code solutions — same reason; the tutor provides them in-session.
- A timeline or schedule — explicitly self-paced.
- A separate plan file — merged into this single document by your request.