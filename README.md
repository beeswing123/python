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
npx vitest run                      # JS runtime tests
```

### Serving the site locally

`site/content/` is a **deploy-time copy** of `content/` — it is gitignored and is
created by the publish job, never committed. A static server started from `site/`
therefore has no lessons until you make that copy yourself, and the page will sit
on "Loading lesson…" with a 404 for `content/manifest.json`.

Serve the exact deployed layout:

```bash
cp -r content site/content && cd site && uv run python -m http.server 8766
# then open http://localhost:8766/
```

Remove `site/content/` again when you are done; do not commit it.

Note that this local server is the *one* environment where an absolute `/assets/...`
path would also work. Every runtime URL in `site/` is deliberately
document-relative so that GitHub Pages, which publishes this as a project site at
`https://<user>.github.io/python/`, resolves them too. Keep new URLs relative.

## Authoring a lesson

See `content/ch01-getting-started/01-hello.md` for the full schema.
