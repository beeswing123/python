# `site/` — Static site for GitHub Pages

This directory is published by the `deploy` job in `.github/workflows/ci.yml`,
which runs only on `main` and only after the `test` job passes.

Every runtime URL here is document-relative (no leading slash): GitHub Pages
serves this as a project site under `/python/`, so `/assets/...` would resolve
to the domain root and 404. `content/` is a gitignored deploy-time copy of the
repository's `content/`; see the root README for how to reproduce that layout
locally.

- `index.html` — Course home and lesson viewer
- `assets/runtime/` — Runtime JavaScript (lesson loader, Pyodide worker, check runner, progress)
- `assets/styles/` — Theme + mobile responsive CSS
