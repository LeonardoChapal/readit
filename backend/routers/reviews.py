from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.review import Review
from models.book import Book
from models.vote import Vote
from models.user import User
from schemas.review import ReviewCreate, ReviewUpdate, ReviewOut
from schemas.vote import VoteCreate, VoteResult
from auth import get_current_user

router = APIRouter(prefix="/api/v1/reviews", tags=["reviews"])


def _load_review(db: Session, review_id: int) -> Review | None:
    return (
        db.query(Review)
        .options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .filter(Review.id == review_id)
        .first()
    )


@router.get("", response_model=list[ReviewOut])
def list_reviews(
    genre_id: int | None = None,
    sort: str = "top",
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    q = db.query(Review).filter(Review.status == "active")
    if genre_id is not None:
        book_ids = db.query(Book.id).filter(Book.genre_id == genre_id).subquery()
        q = q.filter(Review.book_id.in_(book_ids))

    if sort == "recent":
        q = q.order_by(Review.created_at.desc())
    elif sort == "rating":
        q = q.order_by(Review.rating.desc().nulls_last(), Review.created_at.desc())
    else:
        q = q.order_by(Review.score.desc(), Review.created_at.desc())

    return (
        q.options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/trending", response_model=list[ReviewOut])
def trending_reviews(limit: int = 5, db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(days=7)
    return (
        db.query(Review)
        .options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .filter(Review.status == "active", Review.created_at >= since)
        .order_by(Review.score.desc(), Review.rating.desc().nulls_last())
        .limit(limit)
        .all()
    )


@router.get("/{review_id}", response_model=ReviewOut)
def get_review(review_id: int, db: Session = Depends(get_db)):
    review = _load_review(db, review_id)
    if not review or review.status != "active":
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    return review


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.query(Book).filter(Book.id == data.book_id).first():
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    review = Review(user_id=current_user.id, **data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return _load_review(db, review.id)


@router.post("/{review_id}/vote", response_model=VoteResult)
def vote_review(
    review_id: int,
    data: VoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id, Review.status == "active").first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    existing = db.query(Vote).filter(
        Vote.user_id == current_user.id, Vote.review_id == review_id
    ).first()

    if existing is None:
        db.add(Vote(user_id=current_user.id, review_id=review_id, value=data.value))
        review.score += data.value
        user_vote = data.value
    elif existing.value == data.value:
        review.score -= existing.value
        db.delete(existing)
        user_vote = None
    else:
        review.score += data.value - existing.value
        existing.value = data.value
        user_vote = data.value

    db.commit()
    db.refresh(review)
    return VoteResult(score=review.score, user_vote=user_vote)


@router.patch("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id, Review.status == "active").first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta reseña")
    review.title = data.title
    review.content = data.content
    review.rating = data.rating
    db.commit()
    return _load_review(db, review.id)


@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id, Review.status == "active").first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta reseña")
    review.status = "deleted"
    db.commit()


@router.get("/{review_id}/my-vote")
def get_my_vote(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vote = db.query(Vote).filter(
        Vote.user_id == current_user.id, Vote.review_id == review_id
    ).first()
    return {"value": vote.value if vote else None}
