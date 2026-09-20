"""Validate and run AST-based check rules.

The same algorithm runs in two places:
  - At content-validation time, via pytest (this file).
  - At lesson runtime, via Pyodide inside the check-runner worker.

Keep the logic identical so authoring-time validation matches runtime checks.
"""
from __future__ import annotations

import ast
from typing import Any

VALID_AST_NODES: set[str] = {
    "Import", "ImportFrom", "FunctionDef", "AsyncFunctionDef", "ClassDef",
    "If", "For", "While", "With", "Try", "Return", "Yield", "Assign",
    "AugAssign", "Call", "Lambda", "ListComp", "DictComp", "SetComp",
    "GeneratorExp",
}

VALID_AST_CHECK_KEYS: set[str] = {
    "must_contain", "must_not_contain", "must_contain_call",
    "must_define_function", "min_lines", "max_lines",
}


def validate_ast_check(check: dict[str, Any]) -> list[str]:
    """Return a list of error messages (empty if valid)."""
    errors: list[str] = []
    if check.get("kind") != "ast":
        return errors
    for key in check:
        if key not in {"kind"} | VALID_AST_CHECK_KEYS:
            errors.append("unknown ast check key: " + key)
    for key in ("must_contain", "must_not_contain"):
        val = check.get(key)
        if val is None:
            continue
        items = val if isinstance(val, list) else [val]
        for item in items:
            if not isinstance(item, str) or item not in VALID_AST_NODES:
                errors.append(key + ": invalid AST node name '" + str(item) + "'")
    call = check.get("must_contain_call")
    if call is not None and not isinstance(call, str):
        errors.append("must_contain_call: must be a string")
    fn = check.get("must_define_function")
    if fn is not None and not isinstance(fn, str):
        errors.append("must_define_function: must be a string")
    for key in ("min_lines", "max_lines"):
        val = check.get(key)
        if val is not None and (not isinstance(val, int) or val < 0):
            errors.append(key + ": must be a non-negative integer")
    return errors


def run_ast_check(code: str, check: dict[str, Any]) -> tuple[bool, str | None]:
    """Run a single AST check. Returns (passed, error_message)."""
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return False, "SyntaxError: " + str(exc.msg) + " (line " + str(exc.lineno) + ")"

    lines = code.splitlines()

    for key in ("must_contain", "must_not_contain"):
        val = check.get(key)
        if val is None:
            continue
        items = val if isinstance(val, list) else [val]
        for item in items:
            present = _has_node(tree, item)
            if key == "must_contain" and not present:
                return False, "Expected AST node '" + item + "' not found"
            if key == "must_not_contain" and present:
                return False, "Did not expect AST node '" + item + "' but found it"

    call = check.get("must_contain_call")
    if call is not None and not _has_call(tree, call):
        return False, "Expected call to '" + call + "()' not found"

    fn = check.get("must_define_function")
    if fn is not None and not _has_function(tree, fn):
        return False, "Expected function definition '" + fn + "' not found"

    if "min_lines" in check and len(lines) < check["min_lines"]:
        return False, (
            "Code too short: " + str(len(lines)) + " < " + str(check["min_lines"]) + " lines"
        )
    if "max_lines" in check and len(lines) > check["max_lines"]:
        return False, (
            "Code too long: " + str(len(lines)) + " > " + str(check["max_lines"]) + " lines"
        )

    return True, None


def _has_node(tree: ast.AST, name: str) -> bool:
    return any(node.__class__.__name__ == name for node in ast.walk(tree))


def _has_call(tree: ast.AST, name: str) -> bool:
    return any(
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == name
        for node in ast.walk(tree)
    )


def _has_function(tree: ast.AST, name: str) -> bool:
    return any(
        isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name
        for node in ast.walk(tree)
    )
