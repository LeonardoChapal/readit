from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.review import Review
from models.book import Book
from models.user import User
from schemas.review import ReviewOut
from schemas.book import BookOut

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.get("/search")
def search(q: str = "", genre_id: int | None = None, db: Session = Depends(get_db)):
    if len(q.strip()) < 2:
        return {"books": [], "reviews": [], "users": []}

    term = f"%{q.strip()}%"

    books_q = (
        db.query(Book)
        .options(joinedload(Book.genre))
        .filter(Book.title.ilike(term) | Book.author.ilike(term))
    )
    if genre_id is not None:
        books_q = books_q.filter(Book.genre_id == genre_id)
    books = books_q.order_by(Book.title).limit(5).all()

    book_ids_sub = (
        db.query(Book.id)
        .filter(Book.title.ilike(term) | Book.author.ilike(term))
        .subquery()
    )

    reviews_q = (
        db.query(Review)
        .options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .filter(
            Review.status == "active",
            Review.title.ilike(term)
            | Review.content.ilike(term)
            | Review.book_id.in_(book_ids_sub),
        )
    )
    if genre_id is not None:
        genre_book_ids = db.query(Book.id).filter(Book.genre_id == genre_id).subquery()
        reviews_q = reviews_q.filter(Review.book_id.in_(genre_book_ids))
    reviews = reviews_q.order_by(Review.score.desc()).limit(20).all()

    users = (
        db.query(User)
        .filter(User.username.ilike(term))
        .limit(5)
        .all()
    )

    return {
        "books":   [BookOut.model_validate(b) for b in books],
        "reviews": [ReviewOut.model_validate(r) for r in reviews],
        "users":   [{"username": u.username, "role": u.role} for u in users],
    }
