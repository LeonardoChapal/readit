from pydantic import BaseModel
from schemas.book import BookOut


class RecommendationOut(BaseModel):
    id: int
    book: BookOut
    score: float
    reason_code: str | None
    was_clicked: bool

    model_config = {"from_attributes": True}


class OnboardingOptions(BaseModel):
    genres: list
    tags: list


class OnboardingComplete(BaseModel):
    genre_ids: list[int]
    tag_ids: list[int] = []
    book_ids: list[int] = []
    preferred_language: str | None = None


class ActivityCreate(BaseModel):
    activity_type: str
    entity_type: str | None = None
    entity_id: int | None = None
    metadata: dict | None = None
    session_id: str | None = None
