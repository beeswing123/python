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
