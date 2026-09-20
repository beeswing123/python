from py_tutorial_build.ast_rules import run_ast_check, validate_ast_check


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
