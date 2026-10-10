from datetime import datetime, timezone
from app.config import get_settings


def coarse_now(bucket_seconds: int | None = None) -> datetime:
    b = bucket_seconds or get_settings().timestamp_bucket_seconds
    now = datetime.now(timezone.utc)
    epoch = int(now.timestamp())
    floored = epoch - (epoch % b)
    return datetime.fromtimestamp(floored, tz=timezone.utc).replace(tzinfo=None)
