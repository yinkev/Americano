"""
FastAPI ML Service for Predictive Analytics (Story 5.2)

Production-grade microservice providing ML prediction capabilities for the Next.js app.
Implements research-grade struggle prediction with async-first architecture.

Author: Americano ML Subsystem
Stack: FastAPI + Prisma Python + Pydantic V2
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routes import predictions, interventions, analytics, its_routes, abab_routes
from app.services.database import prisma
from app.utils.logging import setup_logging
from app.utils.config import settings


# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown events.
    Handles Prisma connection lifecycle.
    """
    # Startup
    logger.info("Starting ML Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DATABASE_URL[:20]}...")

    await prisma.connect()
    logger.info("Prisma client connected")

    yield

    # Shutdown
    logger.info("Shutting down ML Service...")
    await prisma.disconnect()
    logger.info("Prisma client disconnected")


# Initialize FastAPI app
app = FastAPI(
    title="Americano ML Service",
    description="Predictive analytics microservice for learning struggle prediction",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)


# CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)


# Include routers
app.include_router(
    predictions.router,
    prefix="/predictions",
    tags=["Predictions"]
)
app.include_router(
    interventions.router,
    prefix="/interventions",
    tags=["Interventions"]
)
app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)
app.include_router(
    its_routes.router,
    tags=["ITS Analysis"]
)
app.include_router(
    abab_routes.router,
    tags=["ABAB Analysis"]
)


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.

    Returns:
        dict: Service health status and metadata
    """
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "connected" if prisma.is_connected() else "disconnected"
    }


@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "Americano ML Service",
        "description": "Predictive Analytics for Learning Struggles (Story 5.2)",
        "version": "1.0.0",
        "docs": "/docs" if settings.ENVIRONMENT == "development" else "disabled",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )
