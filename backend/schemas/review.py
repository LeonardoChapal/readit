from pydantic import BaseModel
from datetime import datetime
from schemas.book import BookOut
from schemas.user import UserOut


class ReviewCreate(BaseModel):
    book_id: int
    title: str
    content: str
    rating: int | None = None

    def model_post_init(self, __context):
        if self.rating is not None and not (1 <= self.rating <= 5):
            raise ValueError("La calificación debe ser entre 1 y 5")


class ReviewUpdate(BaseModel):
    title: str
    content: str
    rating: int | None = None

    def model_post_init(self, __context):
        if self.rating is not None and not (1 <= self.rating <= 5):
            raise ValueError("La calificación debe ser entre 1 y 5")


class ReviewOut(BaseModel):
    id: int
    title: str
    content: str
    score: int
    rating: int | None
    status: str
    created_at: datetime
    book: BookOut
    user: UserOut

    model_config = {"from_attributes": True}
