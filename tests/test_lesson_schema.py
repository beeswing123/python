from pathlib import Path

import pytest

from py_tutorial_build.lesson_schema import validate_lesson

CONTENT_ROOT = Path(__file__).resolve().parent.parent / "content"


@pytest.mark.parametrize(
    "md_path",
    sorted(CONTENT_ROOT.rglob("*.md")),
    ids=lambda p: str(p.relative_to(CONTENT_ROOT)),
)
def test_every_lesson_validates(md_path: Path) -> None:
    errors = validate_lesson(md_path)
    assert errors == [], f"{md_path.name} failed: {errors}"
