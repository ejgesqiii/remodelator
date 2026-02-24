from __future__ import annotations


class CriticalDependencyError(RuntimeError):
    """Raised when a required external dependency is unavailable."""

