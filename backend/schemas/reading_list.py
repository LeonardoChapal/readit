from pydantic import BaseModel
from schemas.book import BookOut


class ReadingListSet(BaseModel):
    status: str  # "want_to_read", "reading", "read"


class ReadingListOut(BaseModel):
    id: int
    book_id: int
    status: str
    book: BookOut

    model_config = {"from_attributes": True}
