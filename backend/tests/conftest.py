import os
import pytest
import base64
from nacl.signing import SigningKey
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
key = SigningKey.generate()
os.environ["SIGNING_KEY_B64"] = base64.b64encode(bytes(key)).decode()

from app.config import get_settings
get_settings.cache_clear()

from app.database import Base, engine, SessionLocal
from app.main import app
from app.deps import get_db

# Use StaticPool so all sqlite:///:memory: connections share the exact same in-memory DB
engine.pool = StaticPool(creator=engine.pool._creator)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    s = SessionLocal()
    app.dependency_overrides[get_db] = lambda: s
    try:
        yield s
    finally:
        app.dependency_overrides.pop(get_db, None)
        s.close()
        Base.metadata.drop_all(bind=engine)
