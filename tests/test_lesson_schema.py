from pathlib import Path

import pytest

from py_tutorial_build.lesson_schema import validate_lesson

CONTENT_ROOT = Path(__file__).resolve().parent.parent / "content"

_FRONTMATTER = """\
id: ch01-l01-hello
chapter: 1
order: 1
title:
  en: "Your First Program"
description:
  en: "Use print() to display text."
starter_code: ""
solution: ""
{checks}"""

_VALID_CHECKS = (
    "checks:\n"
    "  - kind: output\n"
    '    expected: "Hello, World!\\n"\n'
    "  - kind: ast\n"
    "    must_contain_call: print\n"
)


def _lesson_text(checks: str) -> str:
    return _FRONTMATTER.format(checks=checks)


VALID_LESSON = _lesson_text(_VALID_CHECKS)


def _write_lesson(tmp_path: Path, frontmatter: str) -> Path:
    """Write a lesson whose frontmatter is `frontmatter` (without the --- fences)."""
    md_path = tmp_path / "lesson.md"
    md_path.write_text("---\n" + frontmatter + "---\n\n# Body\n", encoding="utf-8")
    return md_path


@pytest.mark.parametrize(
    "md_path",
    sorted(CONTENT_ROOT.rglob("*.md")),
    ids=lambda p: str(p.relative_to(CONTENT_ROOT)),
)
def test_every_lesson_validates(md_path: Path) -> None:
    errors = validate_lesson(md_path)
    assert errors == [], f"{md_path.name} failed: {errors}"


def test_valid_lesson_returns_no_errors(tmp_path: Path) -> None:
    """The control: a lesson that satisfies every rule must come back clean."""
    assert validate_lesson(_write_lesson(tmp_path, VALID_LESSON)) == []


@pytest.mark.parametrize(
    ("frontmatter", "expected"),
    [
        pytest.param(
            _lesson_text(""),
            "'checks' is a required property",
            id="missing-checks",
        ),
        pytest.param(
            VALID_LESSON.replace("id: ch01-l01-hello", "id: lesson-2"),
            "does not match",
            id="non-conforming-id",
        ),
        pytest.param(
            _lesson_text("checks:\n  - kind: output\n"),
            "output kind requires 'expected'",
            id="output-without-expected",
        ),
        pytest.param(
            _lesson_text("checks:\n  - kind: ast\n    must_not_contain: [Nonsense]\n"),
            "invalid AST node name 'Nonsense'",
            id="ast-invalid-node",
        ),
        pytest.param(
            _lesson_text("checks: oops\n"),
            "is not of type 'array'",
            id="checks-not-a-list",
        ),
        pytest.param(
            _lesson_text('checks:\n  - expected: "x"\n'),
            "'kind' is a required property",
            id="check-without-kind",
        ),
        pytest.param(
            _lesson_text("checks:\n  - kind: knd\n"),
            "is not one of ['output', 'ast']",
            id="unknown-check-kind",
        ),
        pytest.param(
            VALID_LESSON + "hnts: []\n",
            "Additional properties are not allowed",
            id="misspelled-optional-key",
        ),
        pytest.param(
            VALID_LESSON.replace("chapter: 1", "chapter: 0"),
            "is less than the minimum of 1",
            id="chapter-below-minimum",
        ),
    ],
)
def test_invalid_lesson_reports_expected_error(
    tmp_path: Path, frontmatter: str, expected: str
) -> None:
    errors = validate_lesson(_write_lesson(tmp_path, frontmatter))
    assert errors, "validator accepted an invalid lesson"
    assert any(expected in err for err in errors), f"expected {expected!r} in {errors}"


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        pytest.param("no frontmatter here\n", "missing frontmatter", id="no-frontmatter"),
        pytest.param("---\nid: ch01-l01-hello\n", "unterminated frontmatter", id="unterminated"),
        pytest.param(
            "---\njust a scalar\n---\n",
            "frontmatter is not a mapping",
            id="not-a-mapping",
        ),
        pytest.param("---\n- a\n- b\n---\n", "frontmatter is not a mapping", id="a-list"),
    ],
)
def test_malformed_frontmatter_returns_one_message(
    tmp_path: Path, text: str, expected: str
) -> None:
    """Malformed frontmatter is reported, not raised, and reported exactly once."""
    md_path = tmp_path / "broken.md"
    md_path.write_text(text, encoding="utf-8")
    errors = validate_lesson(md_path)
    assert len(errors) == 1, errors
    assert expected in errors[0]
