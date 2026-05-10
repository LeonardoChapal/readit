from pydantic import BaseModel
from datetime import datetime
from schemas.user import UserOut


class CommentCreate(BaseModel):
    content: str
    parent_comment_id: int | None = None


class CommentOut(BaseModel):
    id: int
    content: str
    status: str
    created_at: datetime
    user: UserOut
    parent_comment_id: int | None
    review_id: int

    model_config = {"from_attributes": True}
