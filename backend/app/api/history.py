"""History endpoints — save and retrieve past analysis results."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import history_store

router = APIRouter(tags=["history"])


class SaveHistoryRequest(BaseModel):
    rec: dict
    plan: dict


@router.post("/history", status_code=201)
async def save_history(body: SaveHistoryRequest) -> dict:
    """Persist one completed analysis (rec + plan) and return its id."""
    entry_id = history_store.save_analysis(body.rec, body.plan)
    return {"id": entry_id}


@router.get("/history")
async def get_history() -> list[dict]:
    """Return all saved analyses, newest first."""
    return history_store.list_history()


@router.get("/history/{entry_id}")
async def get_history_entry(entry_id: int) -> dict:
    """Return one saved analysis by id."""
    entry = history_store.get_entry(entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="History entry not found.")
    return entry


@router.delete("/history/{entry_id}", status_code=204)
async def delete_history_entry(entry_id: int) -> None:
    """Delete one history entry."""
    if not history_store.delete_entry(entry_id):
        raise HTTPException(status_code=404, detail="History entry not found.")


@router.delete("/history", status_code=204)
async def clear_history() -> None:
    """Delete all history entries."""
    history_store.clear_history()
