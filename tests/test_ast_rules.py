import json

from py_tutorial_build.ast_rules import run_ast_check, run_ast_check_json, validate_ast_check

# ch01-l01-hello's real ast check, copied from content/manifest.json.
HELLO_AST_CHECK: dict[str, object] = {
    "kind": "ast",
    "must_contain_call": "print",
    "must_not_contain": ["Import", "While"],
}


class TestRunAstCheck:
    def test_must_contain_call_passes(self) -> None:
        code = 'print("hi")'
        assert run_ast_check(code, {"kind": "ast", "must_contain_call": "print"})[0] is True

    def test_must_contain_call_fails_when_missing(self) -> None:
        passed, err = run_ast_check('print("hi")', {"kind": "ast", "must_contain_call": "len"})
        assert passed is False
        assert "len" in (err or "")

    def test_must_not_contain_fails_when_present(self) -> None:
        passed, err = run_ast_check("import os", {"kind": "ast", "must_not_contain": "Import"})
        assert passed is False
        assert "Import" in (err or "")

    def test_must_define_function(self) -> None:
        code = "def greet(): pass"
        assert run_ast_check(code, {"kind": "ast", "must_define_function": "greet"})[0] is True

    def test_syntax_error_returns_syntax_error(self) -> None:
        passed, err = run_ast_check("def broken(:", {"kind": "ast", "must_contain_call": "print"})
        assert passed is False
        assert "SyntaxError" in (err or "")

    def test_min_lines(self) -> None:
        assert run_ast_check("x = 1", {"kind": "ast", "min_lines": 3})[0] is False

    def test_max_lines(self) -> None:
        assert run_ast_check("x = 1\ny = 2", {"kind": "ast", "max_lines": 1})[0] is False


class TestRunAstCheckJson:
    """The Pyodide worker's entry point, executed for real.

    These run in plain pytest — no Pyodide — which is why the JSON plumbing is
    verifiable at all. The worker used to build its Python source as
    ``'check = json.loads(' + checkJson + ')'``; because ``checkJson`` is an
    object literal that produced ``json.loads({...})`` and raised
    ``TypeError: the JSON object must be str, bytes or bytearray, not dict``,
    which the worker's catch reported as ``passed: false`` — so every ast check
    failed at runtime, including the one shipped lesson's.
    """

    def test_the_lesson_check_passes_for_the_solution(self) -> None:
        result = json.loads(
            run_ast_check_json(json.dumps(HELLO_AST_CHECK), 'print("Hello, World!")')
        )
        assert result == {"passed": True, "error": None}

    def test_the_lesson_check_fails_without_the_required_call(self) -> None:
        result = json.loads(run_ast_check_json(json.dumps(HELLO_AST_CHECK), "x = 1"))
        assert result["passed"] is False
        assert "print" in result["error"]

    def test_the_lesson_check_fails_on_a_forbidden_node(self) -> None:
        result = json.loads(
            run_ast_check_json(json.dumps(HELLO_AST_CHECK), 'import os\nprint("hi")')
        )
        assert result["passed"] is False
        assert "Import" in result["error"]

    def test_a_syntax_error_is_a_failed_check_not_an_exception(self) -> None:
        result = json.loads(run_ast_check_json(json.dumps(HELLO_AST_CHECK), "def broken(:"))
        assert result["passed"] is False
        assert "SyntaxError" in result["error"]

    def test_returns_json_text(self) -> None:
        out = run_ast_check_json(json.dumps(HELLO_AST_CHECK), 'print("hi")')
        assert isinstance(out, str)
        assert json.loads(out)["passed"] is True

    def test_nested_check_payload_round_trips(self) -> None:
        # The nested shape is the one that broke: a list value inside the check
        # object cannot survive being pasted into source text.
        check = {"kind": "ast", "must_contain": ["FunctionDef"], "min_lines": 2}
        result = json.loads(run_ast_check_json(json.dumps(check), "def f():\n    return 1"))
        assert result == {"passed": True, "error": None}

    def test_code_containing_quotes_and_newlines_round_trips(self) -> None:
        # Also data, not source text: a code string is not a JSON literal.
        code = 'print("He said \\"hi\\"")\nprint(1)'
        result = json.loads(run_ast_check_json(json.dumps(HELLO_AST_CHECK), code))
        assert result["passed"] is True


class TestValidateAstCheck:
    def test_unknown_node_name(self) -> None:
        errs = validate_ast_check({"kind": "ast", "must_contain": ["NotARealNode"]})
        assert any("NotARealNode" in e for e in errs)

    def test_unknown_check_key(self) -> None:
        errs = validate_ast_check({"kind": "ast", "what_is_this": 1})
        assert any("unknown ast check key" in e for e in errs)

    def test_min_lines_negative(self) -> None:
        errs = validate_ast_check({"kind": "ast", "min_lines": -1})
        assert any("non-negative integer" in e for e in errs)
