import json
from pathlib import Path

import pytest

from py_tutorial_build.build_manifest import build_manifest


def test_build_manifest_writes_lesson_index(tmp_path: Path) -> None:
    content_dir = tmp_path / "content"
    ch_dir = content_dir / "ch01-getting-started"
    ch_dir.mkdir(parents=True)
    (ch_dir / "01-hello.md").write_text(
        "---\nid: ch01-l01-hello\nchapter: 1\norder: 1\ntitle:\n  en: Hi\n  zh: 嗨\n---\n# hi\n"
    )

    out = content_dir / "manifest.json"
    build_manifest(content_dir, out)

    data = json.loads(out.read_text())
    assert len(data["lessons"]) == 1
    entry = data["lessons"][0]
    assert entry["id"] == "ch01-l01-hello"
    assert entry["chapter_dir"] == "ch01-getting-started"
    assert entry["file"] == "01-hello.md"
    assert entry["chapter"] == 1
    assert entry["order"] == 1


def test_build_manifest_orders_by_chapter_then_order(tmp_path: Path) -> None:
    content_dir = tmp_path / "content"
    ch_dir = content_dir / "ch01-getting-started"
    ch_dir.mkdir(parents=True)
    (ch_dir / "02-second.md").write_text("---\nid: ch01-l02\nchapter: 1\norder: 2\n---\n")
    (ch_dir / "01-first.md").write_text("---\nid: ch01-l01\nchapter: 1\norder: 1\n---\n")

    out = content_dir / "manifest.json"
    build_manifest(content_dir, out)

    ids = [e["id"] for e in json.loads(out.read_text())["lessons"]]
    assert ids == ["ch01-l01", "ch01-l02"]


def test_build_manifest_skips_files_without_id(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    content_dir = tmp_path / "content"
    content_dir.mkdir()
    (content_dir / "no-id.md").write_text("---\nchapter: 1\n---\n")

    out = content_dir / "manifest.json"
    build_manifest(content_dir, out)
    captured = capsys.readouterr()
    assert "no-id" in captured.err
    assert json.loads(out.read_text())["lessons"] == []


def test_build_manifest_embeds_parsed_frontmatter(tmp_path: Path) -> None:
    """The browser has no YAML parser, so the manifest must carry real parsed values."""
    content_dir = tmp_path / "content"
    ch_dir = content_dir / "ch01-getting-started"
    ch_dir.mkdir(parents=True)
    (ch_dir / "01-hello.md").write_text(
        "---\n"
        "id: ch01-l01-hello\n"
        "chapter: 1\n"
        "order: 1\n"
        # Derived path fields must win over same-named frontmatter keys.
        "file: bogus.md\n"
        "title:\n  en: Hi\n  zh: 嗨\n"
        "starter_code: |\n  print('hi')\n"
        "hints:\n  - en: Use print\n    zh: 用 print\n"
        "checks:\n"
        "  - kind: output\n"
        '    expected: "hi\\n"\n'
        "  - kind: ast\n"
        "    must_contain_call: print\n"
        "    must_not_contain: [Import, While]\n"
        "---\n"
        "# hi\n"
    )

    out = content_dir / "manifest.json"
    build_manifest(content_dir, out)

    entry = json.loads(out.read_text())["lessons"][0]
    assert entry["title"] == {"en": "Hi", "zh": "嗨"}
    assert entry["starter_code"] == "print('hi')\n"
    assert entry["hints"] == [{"en": "Use print", "zh": "用 print"}]

    checks = entry["checks"]
    assert isinstance(checks, list)
    assert all(isinstance(c, dict) for c in checks)
    assert checks[0] == {"kind": "output", "expected": "hi\n"}
    assert checks[1]["must_contain_call"] == "print"
    assert checks[1]["must_not_contain"] == ["Import", "While"]

    assert entry["id"] == "ch01-l01-hello"
    assert entry["file"] == "01-hello.md"
    assert entry["chapter_dir"] == "ch01-getting-started"
