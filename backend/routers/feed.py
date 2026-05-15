from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.review import Review
from models.book import Book
from models.follow import Follow
from models.user import User
from schemas.review import ReviewOut
from auth import get_current_user

router = APIRouter(prefix="/api/v1/feed", tags=["feed"])


@router.get("", response_model=list[ReviewOut])
def get_feed(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    following_ids = db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).subquery()
    return (
        db.query(Review)
        .options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .filter(Review.user_id.in_(following_ids), Review.status == "active")
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
