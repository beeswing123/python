"""Validate lesson Markdown files against the JSON schema."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft7Validator

from py_tutorial_build.ast_rules import validate_ast_check

SCHEMA_PATH = Path(__file__).parent / "schemas" / "lesson.schema.json"


def _extract_frontmatter(md_path: Path) -> dict[str, Any]:
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
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
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
        elif check.get("kind") == "output" and "expected" not in check:
            errors.append("checks[" + str(i) + "]: output kind requires 'expected'")

    return errors
