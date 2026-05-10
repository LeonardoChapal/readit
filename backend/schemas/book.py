from pydantic import BaseModel
from schemas.genre import GenreOut


class BookCreate(BaseModel):
    title: str
    author: str
    year: int | None = None
    genre_id: int | None = None


class BookOut(BaseModel):
    id: int
    title: str
    author: str
    year: int | None
    genre: GenreOut | None

    model_config = {"from_attributes": True}


class BookDetail(BookOut):
    avg_rating: float | None = None
    rating_count: int = 0
