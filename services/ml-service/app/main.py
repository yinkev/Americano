from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .routes import health as health_routes
except Exception:  # pragma: no cover - allow running without package context
    # Support running as a script without package-relative imports
    import routes.health as health_routes  # type: ignore

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
app.include_router(health_routes.router, prefix="", tags=["health"])


# Allow `python -m app.main` for local runs
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
