"""
Database access helpers.

When DB_ADAPTER=prisma, exposes a Prisma client (lazy).
When DB_ADAPTER=sqlalchemy, routes should avoid Prisma and use repository adapters.
"""

import logging
from typing import Any, Optional
from app.utils.config import settings

logger = logging.getLogger(__name__)

_prisma: Optional[Any] = None


def _get_prisma_client() -> Any:
    global _prisma
    if _prisma is None:
        # Import lazily to avoid requiring generated client unless needed
        from prisma import Prisma  # type: ignore

        _prisma = Prisma(auto_register=True, log_queries=False)
    return _prisma


async def get_db() -> Any:
    if settings.DB_ADAPTER.lower() != "prisma":
        return None
    client = _get_prisma_client()
    if not client.is_connected():
        await client.connect()
    return client
