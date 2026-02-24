from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from threading import Lock
from time import monotonic


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    limit: int
    remaining: int
    retry_after_seconds: int


class SlidingWindowRateLimiter:
    def __init__(self, window_seconds: int) -> None:
        self._window_seconds = max(1, int(window_seconds))
        self._buckets: dict[str, deque[float]] = {}
        self._lock = Lock()

    def check(self, key: str, limit: int) -> RateLimitDecision:
        now = monotonic()
        bucket_limit = max(1, int(limit))
        cutoff = now - self._window_seconds
        with self._lock:
            bucket = self._buckets.setdefault(key, deque())
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= bucket_limit:
                retry_after = max(1, int((bucket[0] + self._window_seconds) - now) + 1)
                return RateLimitDecision(
                    allowed=False,
                    limit=bucket_limit,
                    remaining=0,
                    retry_after_seconds=retry_after,
                )

            bucket.append(now)
            remaining = max(0, bucket_limit - len(bucket))
            return RateLimitDecision(
                allowed=True,
                limit=bucket_limit,
                remaining=remaining,
                retry_after_seconds=0,
            )
