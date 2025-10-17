"""
Database connection module using SQLAlchemy async for PostgreSQL.

Provides async database session management for Story 4.6 analytics queries.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from src.config import settings


# ============================================================================
# Async Engine Setup
# ============================================================================

# Convert postgres:// to postgresql+asyncpg:// for async support
DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.environment == "development",  # SQL logging in dev
    pool_size=10,  # Connection pool size
    max_overflow=20,  # Allow extra connections under load
    pool_pre_ping=True,  # Verify connections before use
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit
)

# Base class for SQLAlchemy models (if needed for ORM)
Base = declarative_base()


# ============================================================================
# Database Session Management
# ============================================================================

@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async context manager for database sessions.

    Usage:
        async with get_db_session() as session:
            result = await session.execute(query)
            await session.commit()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def test_connection() -> bool:
    """
    Test database connectivity.

    Returns:
        True if connection successful, False otherwise.
    """
    try:
        async with get_db_session() as session:
            await session.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


# ============================================================================
# Lifecycle Management
# ============================================================================

async def init_db():
    """Initialize database connection on app startup."""
    print("📦 Initializing database connection...")
    connected = await test_connection()
    if connected:
        print("✅ Database connection established")
    else:
        print("⚠️  Database connection failed - analytics endpoints may not work")


async def close_db():
    """Close database connections on app shutdown."""
    print("🔌 Closing database connections...")
    await engine.dispose()
    print("✅ Database connections closed")
