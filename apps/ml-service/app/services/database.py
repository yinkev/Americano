"""
Prisma Python Client Singleton

Manages database connection lifecycle for the FastAPI application.
"""

from prisma import Prisma
import logging

logger = logging.getLogger(__name__)

# Global Prisma client instance
prisma = Prisma(
    auto_register=True,
    log_queries=False  # Set to True for debugging
)


async def get_db() -> Prisma:
    """
    Dependency for FastAPI routes that need database access.

    Usage:
        @router.get("/...")
        async def endpoint(db: Prisma = Depends(get_db)):
            ...

    Returns:
        Prisma: Connected database client
    """
    if not prisma.is_connected():
        await prisma.connect()
    return prisma
