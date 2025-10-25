from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.utils.config import settings


def _normalized_url(url: str) -> str:
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        return url.replace("postgresql://", "postgresql+psycopg://").replace(
            "postgres://", "postgresql+psycopg://"
        )
    return url


engine = create_engine(_normalized_url(settings.DATABASE_URL), pool_pre_ping=True)


@contextmanager
def session() -> Iterator[Session]:
    s = Session(engine)
    try:
        yield s
    finally:
        s.close()

