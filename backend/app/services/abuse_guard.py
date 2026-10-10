import re
from collections import defaultdict, deque
from datetime import datetime, timedelta

# In-memory sliding window — swap for Redis in production.
_windows: dict[str, deque] = defaultdict(deque)

BANNED_PATTERNS = [
    re.compile(r"(?i)\b(free money|click here|bitcoin giveaway)\b"),
]


def check_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    now = datetime.utcnow()
    q = _windows[key]
    cutoff = now - timedelta(seconds=window_seconds)
    while q and q[0] < cutoff:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now)
    return True


def looks_like_spam(text: str) -> bool:
    for pat in BANNED_PATTERNS:
        if pat.search(text or ""):
            return True
    return False
