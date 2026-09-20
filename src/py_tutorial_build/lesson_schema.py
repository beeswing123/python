"""Validate lesson Markdown files against the JSON schema."""

from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft7Validator

from py_tutorial_build.ast_rules import validate_ast_check
from py_tutorial_build.frontmatter import parse_frontmatter

SCHEMA_PATH = Path(__file__).parent / "schemas" / "lesson.schema.json"


def validate_lesson(md_path: Path) -> list[str]:
    """Return a list of error messages (empty if valid)."""
    try:
        fm = parse_frontmatter(md_path)
    except ValueError as exc:
        return [str(exc)]

    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = Draft7Validator(schema)
    errors: list[str] = []
    for err in sorted(validator.iter_errors(fm), key=lambda e: list(e.absolute_path)):
        path = ".".join(str(p) for p in err.absolute_path) or "<root>"
        errors.append(path + ": " + err.message)

    # Only walk the checks when the schema accepted them as a list; a non-list
    # value has already produced its own error above.
    checks = fm.get("checks")
    if not isinstance(checks, list):
        return errors

    for i, check in enumerate(checks):
        if not isinstance(check, dict):
            errors.append("checks[" + str(i) + "]: not an object")
            continue
        if check.get("kind") == "ast":
            for sub_err in validate_ast_check(check):
                errors.append("checks[" + str(i) + "]: " + sub_err)
        elif check.get("kind") == "output" and "expected" not in check:
            errors.append("checks[" + str(i) + "]: output kind requires 'expected'")

    return errors
