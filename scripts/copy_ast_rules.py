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
