"""Extract and parse the YAML frontmatter of a lesson Markdown file.

The manifest builder and the schema validator must agree on exactly which bytes
count as a lesson's frontmatter: the builder decides what gets published to the
browser, the validator decides what is accepted. Keeping one parser here stops
those two definitions from drifting apart.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


def parse_frontmatter(md_path: Path) -> dict[str, Any]:
    """Return the frontmatter mapping of md_path.

    Raises ValueError if the file has no frontmatter block, if the block is
    never terminated, or if it does not parse to a mapping.
    """
    text = md_path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(str(md_path) + ": missing frontmatter")
    end = text.find("\n---\n", 4)
    if end < 0:
        raise ValueError(str(md_path) + ": unterminated frontmatter")
    parsed = yaml.safe_load(text[4:end])
    if not isinstance(parsed, dict):
        raise ValueError(str(md_path) + ": frontmatter is not a mapping")
    return parsed
