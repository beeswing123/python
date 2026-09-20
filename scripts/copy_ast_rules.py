"""Copy src/py_tutorial_build/ast_rules.py into site/assets/runtime/ast_rules.py.js.

The two files must stay byte-identical: pytest validates lesson content against
the Python module, while Pyodide runs the .js copy at check time. The CI test
job reruns this script and fails on `git diff`, so an edit to ast_rules.py that
is not copied here breaks the build rather than silently desynchronising
authoring-time validation from runtime checking.

Run it by hand after editing ast_rules.py:
    uv run python scripts/copy_ast_rules.py

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
