from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analysis import router as analysis_router
from app.api.history import router as history_router

app = FastAPI(
    title="Index Recommendation Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "application": "Index Recommendation Engine"
    }


app.include_router(analysis_router, prefix="/api")
app.include_router(history_router, prefix="/api")
