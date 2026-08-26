from fastapi import FastAPI

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