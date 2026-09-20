"""Generate content/manifest.json by scanning content/**/*.md files.

The manifest is the only route lesson metadata takes to the browser: the page
has no YAML parser, so each lesson's fully-parsed frontmatter is embedded here
as real JSON values (objects, arrays, strings) alongside the fields the loader
needs in order to locate the lesson's Markdown file.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml


def _parse_frontmatter(md_path: Path) -> dict[str, Any]:
    text = md_path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(str(md_path) + ": missing frontmatter")
    end = text.find("\n---\n", 4)
    if end < 0:
        raise ValueError(str(md_path) + ": unterminated frontmatter")
    parsed = yaml.safe_load(text[4:end])
    return parsed if isinstance(parsed, dict) else {}


def build_manifest(content_dir: Path, out_path: Path) -> None:
    """Scan content_dir for .md files, parse frontmatter, write out_path."""
    entries: list[dict[str, Any]] = []
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
        # Spread the parsed frontmatter so metadata (title, starter_code,
        # hints, checks, ...) reaches the browser as real values, then let the
        # path-derived fields win over any same-named frontmatter key.
        entry: dict[str, Any] = {**fm}
        entry["id"] = lesson_id
        entry["chapter_dir"] = rel.parts[0] if len(rel.parts) > 1 else ""
        entry["file"] = rel.name
        entry["chapter"] = fm.get("chapter", 0)
        entry["order"] = fm.get("order", 0)
        entries.append(entry)
    entries.sort(key=lambda e: (e["chapter"], e["order"], e["id"]))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # default=str: YAML also yields dates and other types JSON cannot encode.
    out_path.write_text(json.dumps({"lessons": entries}, indent=2, default=str), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate content/manifest.json")
    parser.add_argument("--content-dir", default="content", type=Path)
    parser.add_argument(
        "--out",
        default=None,
        type=Path,
        help="Output path; defaults to <content-dir>/manifest.json",
    )
    args = parser.parse_args(argv)
    content_dir: Path = args.content_dir
    out_path: Path = args.out or content_dir / "manifest.json"
    build_manifest(content_dir, out_path)
    count = len(json.loads(out_path.read_text(encoding="utf-8"))["lessons"])
    print("wrote " + str(out_path) + " (" + str(count) + " lessons)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
