#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import shlex
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]

INLINE_LINK_PATTERN = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


@dataclass(frozen=True)
class LinkIssue:
    file: Path
    line_number: int
    target: str
    reason: str


def _iter_markdown_files(include_archive: bool) -> list[Path]:
    files: list[Path] = [
        ROOT / "README.md",
        ROOT / "ARCHITECTURE.md",
        ROOT / "ACTION_PLAN.md",
        ROOT / "scripts" / "README.md",
        ROOT / "apps" / "web" / "README.md",
    ]
    files.extend(sorted((ROOT / "docs").glob("*.md")))
    if include_archive:
        files.extend(sorted((ROOT / "archive" / "docs").glob("*.md")))
    return [path for path in files if path.exists()]


def _strip_title_suffix(raw_target: str) -> str:
    candidate = raw_target.strip()
    if candidate.startswith("<") and candidate.endswith(">"):
        candidate = candidate[1:-1]
    if " " not in candidate:
        return candidate
    try:
        parsed = shlex.split(candidate)
    except ValueError:
        parsed = candidate.split(" ")
    return parsed[0] if parsed else ""


def _is_external_or_anchor(target: str) -> bool:
    lowered = target.lower()
    return (
        lowered.startswith("http://")
        or lowered.startswith("https://")
        or lowered.startswith("mailto:")
        or lowered.startswith("#")
    )


def _resolve_target(source_file: Path, target: str) -> Path:
    if target.startswith("/"):
        return (ROOT / target.lstrip("/")).resolve()
    return (source_file.parent / target).resolve()


def _collect_issues(markdown_files: list[Path]) -> list[LinkIssue]:
    issues: list[LinkIssue] = []
    for path in markdown_files:
        in_fence = False
        for idx, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_fence = not in_fence
                continue
            if in_fence:
                continue

            for match in INLINE_LINK_PATTERN.finditer(line):
                raw_target = match.group(1).strip()
                target = _strip_title_suffix(raw_target)
                if not target:
                    continue
                if target.lower().startswith("javascript:"):
                    issues.append(
                        LinkIssue(
                            file=path,
                            line_number=idx,
                            target=raw_target,
                            reason="javascript links are not allowed",
                        )
                    )
                    continue
                if _is_external_or_anchor(target):
                    continue

                normalized_target = unquote(target).split("#", 1)[0]
                if not normalized_target:
                    continue
                resolved = _resolve_target(path, normalized_target)
                if not resolved.exists():
                    issues.append(
                        LinkIssue(
                            file=path,
                            line_number=idx,
                            target=target,
                            reason=f"target not found: {resolved}",
                        )
                    )
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate local markdown links in active docs.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero when broken links are detected.",
    )
    parser.add_argument(
        "--include-archive",
        action="store_true",
        help="Also validate links inside archive/docs markdown files.",
    )
    args = parser.parse_args()

    markdown_files = _iter_markdown_files(include_archive=args.include_archive)
    issues = _collect_issues(markdown_files)

    if issues:
        for issue in issues:
            print(
                f"{issue.file.relative_to(ROOT)}:{issue.line_number}: "
                f"{issue.target} -> {issue.reason}",
                file=sys.stderr,
            )
        if args.check:
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
