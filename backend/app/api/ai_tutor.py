"""AI Tutor endpoints — educational explanations of the rule-based recommendation."""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services import ai_tutor

router = APIRouter(tags=["ai-tutor"])


class ExplainRequest(BaseModel):
    rec:  dict = Field(description="Full RecommendationResponse payload")
    plan: dict = Field(description="Full QueryPlanResponse payload")


class FollowupRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    rec:  dict
    plan: dict


@router.post("/explain")
async def explain_recommendation(body: ExplainRequest) -> dict:
    """Return a structured educational explanation of the recommendation."""
    return await ai_tutor.explain({"rec": body.rec, "plan": body.plan})


@router.post("/explain/followup")
async def explain_followup(body: FollowupRequest) -> dict:
    """Answer a follow-up question about the current analysis."""
    answer = await ai_tutor.followup(
        body.question, {"rec": body.rec, "plan": body.plan}
    )
    return {"answer": answer}
