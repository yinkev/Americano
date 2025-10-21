"""
Americano Python API - Understanding Validation Engine

FastAPI service for AI-powered comprehension evaluation.
Serves ALL Epic 4 validation needs (Stories 4.1-4.6).
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.validation.routes import router as validation_router
from src.validation.models import HealthCheckResponse
from src.challenge.routes import router as challenge_router
from src.analytics.routes import router as analytics_router
from src.adaptive.routes import router as adaptive_router
from src.database import init_db, close_db


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="Americano Validation API",
    description="AI-powered understanding validation for medical education",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================================================
# CORS Middleware (for Next.js integration)
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Exception Handlers
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unexpected errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "error": str(exc) if settings.environment == "development" else "Internal server error"
        }
    )


# ============================================================================
# Health Check Endpoint
# ============================================================================

@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["health"],
    summary="Health check",
    description="Check if the API service is running and healthy"
)
async def health_check() -> HealthCheckResponse:
    """Health check endpoint for monitoring."""
    return HealthCheckResponse(status="healthy")


# ============================================================================
# Include Routers
# ============================================================================

app.include_router(validation_router)
app.include_router(challenge_router)
app.include_router(analytics_router)
app.include_router(adaptive_router)


# ============================================================================
# Startup/Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print(f"🚀 Americano Validation API starting...")
    print(f"📝 Environment: {settings.environment}")
    print(f"🤖 OpenAI Model: {settings.openai_model}")
    print(f"🌐 CORS Origins: {settings.cors_origins}")

    # Initialize database connection pool
    await init_db()

    print(f"✅ API ready at http://{settings.api_host}:{settings.api_port}")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print("👋 Americano Validation API shutting down...")

    # Close database connection pool
    await close_db()


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.environment == "development",
        log_level=settings.log_level,
    )
