from fastapi import FastAPI

from app.api.analysis import router as analysis_router

app = FastAPI(
    title="Index Recommendation Engine",
    version="1.0.0"
)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "application": "Index Recommendation Engine"
    }


app.include_router(analysis_router, prefix="/api")
