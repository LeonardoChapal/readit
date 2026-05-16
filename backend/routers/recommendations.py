from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

from database import get_db
from models.book import Book
from models.genre import Genre
from models.tag import Tag
from models.user_interest import UserInterest
from models.user_activity import UserActivity
from models.recommendation_cache import RecommendationCache
from models.reading_list import ReadingList
from models.review import Review
from schemas.recommendation import RecommendationOut
from auth import get_current_user

router = APIRouter(prefix="/api/v1/recommendations", tags=["recommendations"])

CACHE_TTL_HOURS = 24


@router.get("", response_model=list[RecommendationOut])
def get_recommendations(
    limit: int = 10,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_TTL_HOURS)
    fresh = (
        db.query(RecommendationCache)
        .filter(
            RecommendationCache.user_id == current_user.id,
            RecommendationCache.created_at >= cutoff,
        )
        .first()
    )
    if not fresh:
        _compute_recommendations(current_user.id, db)

    recs = (
        db.query(RecommendationCache)
        .options(joinedload(RecommendationCache.book).joinedload(Book.genre))
        .filter(RecommendationCache.user_id == current_user.id)
        .order_by(RecommendationCache.score.desc())
        .limit(limit)
        .all()
    )

    now = datetime.now(timezone.utc)
    for rec in recs:
        rec.served_at = now
    db.commit()

    return recs


@router.post("/{rec_id}/click", status_code=204)
def click_recommendation(
    rec_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = (
        db.query(RecommendationCache)
        .filter(RecommendationCache.id == rec_id, RecommendationCache.user_id == current_user.id)
        .first()
    )
    if rec:
        rec.was_clicked = True
        db.add(UserActivity(
            user_id=current_user.id,
            activity_type="click_recommendation",
            entity_type="book",
            entity_id=rec.book_id,
            metadata_={"rec_id": rec_id, "reason_code": rec.reason_code},
        ))
        db.commit()


def _compute_recommendations(user_id: int, db: Session):
    interests = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
    genre_weights = {i.entity_id: float(i.weight) for i in interests if i.entity_type == "genre"}
    tag_weights = {i.entity_id: float(i.weight) for i in interests if i.entity_type == "tag"}

    if not genre_weights and not tag_weights:
        return

    # Mapas de nombres para construir reason_code legible
    genre_names: dict[int, str] = {g.id: g.name for g in db.query(Genre).all()}
    tag_names: dict[int, str] = {t.id: t.name for t in db.query(Tag).all()}

    excluded = set()
    for rl in db.query(ReadingList).filter(ReadingList.user_id == user_id).all():
        excluded.add(rl.book_id)
    for rv in db.query(Review).filter(Review.user_id == user_id, Review.status == "active").all():
        excluded.add(rv.book_id)

    books = (
        db.query(Book)
        .options(joinedload(Book.genre), joinedload(Book.tags))
        .filter(Book.id.notin_(excluded) if excluded else True)
        .all()
    )

    review_scores = {}
    rows = (
        db.query(Review.book_id, func.avg(Review.score).label("avg_score"))
        .filter(Review.status == "active")
        .group_by(Review.book_id)
        .all()
    )
    if rows:
        max_score = max(float(r.avg_score or 0) for r in rows) or 1
        for r in rows:
            review_scores[r.book_id] = float(r.avg_score or 0) / max_score

    scored = []
    for book in books:
        score = 0.0
        # contribuciones nombradas (label, valor) para elegir la mejor razón
        contribs: list[tuple[str, float]] = []

        if book.genre_id and book.genre_id in genre_weights:
            genre_contrib = genre_weights[book.genre_id] * 0.7
            score += genre_contrib
            gname = genre_names.get(book.genre_id)
            if gname:
                contribs.append((f"genre:{gname}", genre_contrib))

        book_tag_ids = {bt.tag_id for bt in book.tags}
        for tid in book_tag_ids:
            tw = tag_weights.get(tid, 0)
            if tw > 0:
                tag_contrib = tw * 0.3
                score += tag_contrib
                tname = tag_names.get(tid)
                if tname:
                    contribs.append((f"tag:{tname}", tag_contrib))

        pop_contrib = review_scores.get(book.id, 0) * 0.2
        score += pop_contrib

        if score > 0:
            # razón = mayor contribución específica; si nada, "popular"
            if contribs:
                contribs.sort(key=lambda c: c[1], reverse=True)
                reason = contribs[0][0]
            else:
                reason = "popular"
            scored.append((book.id, round(score, 4), reason))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:20]

    db.query(RecommendationCache).filter(RecommendationCache.user_id == user_id).delete()
    for book_id, score, reason in top:
        db.add(RecommendationCache(
            user_id=user_id,
            book_id=book_id,
            score=score,
            reason_code=reason,
        ))
    db.commit()
