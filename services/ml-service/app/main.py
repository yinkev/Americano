from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .routes import (
        health_router,
        interventions_router,
        model_performance_router,
        predictions_feedback_router,
        predictions_generate_router,
        predictions_router,
        struggle_reduction_router,
    )
except Exception:  # pragma: no cover - allow running without package context
    # Support running as a script without package-relative imports
    from routes import (  # type: ignore
        health_router,
        interventions_router,
        model_performance_router,
        predictions_feedback_router,
        predictions_generate_router,
        predictions_router,
        struggle_reduction_router,
    )

app = FastAPI(title="Americano ML Service", version="0.1.0")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"service": "americano-ml", "status": "ok"}


# Mount routers
app.include_router(health_router, tags=["health"])
app.include_router(predictions_router, tags=["predictions"])
app.include_router(predictions_generate_router, tags=["predictions"])
app.include_router(predictions_feedback_router, tags=["predictions"])
app.include_router(interventions_router, tags=["interventions"])
app.include_router(model_performance_router, tags=["analytics"])
app.include_router(struggle_reduction_router, tags=["analytics"])


# Allow `python -m app.main` for local runs
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
