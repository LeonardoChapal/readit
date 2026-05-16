from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from database import get_db
from models.book import Book
from models.tag import BookTag
from models.review import Review
from models.user import User
from schemas.book import BookCreate, BookOut, BookDetail, TagSimple
from schemas.review import ReviewOut
from auth import get_current_user

router = APIRouter(prefix="/api/v1/books", tags=["books"])


def _detect_mime(data: bytes) -> str:
    if data[:3] == b'\xff\xd8\xff':
        return "image/jpeg"
    if data[:4] == b'\x89PNG':
        return "image/png"
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return "image/webp"
    return "image/jpeg"


@router.get("", response_model=list[BookOut])
def list_books(genre_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Book).options(joinedload(Book.genre))
    if genre_id is not None:
        q = q.filter(Book.genre_id == genre_id)
    return q.order_by(Book.title).all()


@router.get("/{book_id}", response_model=BookDetail)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).options(joinedload(Book.genre)).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    agg = (
        db.query(func.avg(Review.rating), func.count(Review.rating))
        .filter(Review.book_id == book_id, Review.status == "active", Review.rating.isnot(None))
        .first()
    )
    avg_rating = round(float(agg[0]), 1) if agg[0] else None
    rating_count = agg[1] or 0

    book_tags = db.query(BookTag).options(joinedload(BookTag.tag)).filter(BookTag.book_id == book_id).all()
    tags = [TagSimple(id=bt.tag.id, name=bt.tag.name) for bt in book_tags]

    # Construir BookDetail manualmente para evitar que Pydantic intente validar
    # book.tags (que son objetos BookTag, no TagSimple) vía from_attributes
    return BookDetail(
        id=book.id,
        title=book.title,
        author=book.author,
        year=book.year,
        genre=book.genre,
        avg_rating=avg_rating,
        rating_count=rating_count,
        tags=tags,
    )


@router.get("/{book_id}/related", response_model=list[BookOut])
def get_related_books(book_id: int, limit: int = 6, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    own_tag_ids = {bt.tag_id for bt in db.query(BookTag).filter(BookTag.book_id == book_id).all()}

    # Candidatos: libros con al menos una etiqueta compartida o del mismo género
    candidates = (
        db.query(Book)
        .options(joinedload(Book.genre), joinedload(Book.tags))
        .filter(Book.id != book_id)
        .all()
    )

    scored: list[tuple[int, Book]] = []
    for b in candidates:
        b_tag_ids = {bt.tag_id for bt in b.tags}
        shared_tags = len(own_tag_ids & b_tag_ids)
        same_genre = 1 if book.genre_id and b.genre_id == book.genre_id else 0
        score = shared_tags * 2 + same_genre
        if score > 0:
            scored.append((score, b))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [b for _, b in scored[:limit]]


@router.get("/{book_id}/reviews", response_model=list[ReviewOut])
def get_book_reviews(book_id: int, sort: str = "top", skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    if not db.query(Book).filter(Book.id == book_id).first():
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    q = (
        db.query(Review)
        .options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .filter(Review.book_id == book_id, Review.status == "active")
    )
    if sort == "recent":
        q = q.order_by(Review.created_at.desc())
    elif sort == "rating":
        q = q.order_by(Review.rating.desc().nulls_last(), Review.created_at.desc())
    else:
        q = q.order_by(Review.score.desc(), Review.created_at.desc())
    return q.offset(skip).limit(limit).all()


@router.get("/{book_id}/cover")
def get_cover(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book or not book.cover:
        raise HTTPException(status_code=404, detail="Sin portada")
    return Response(content=book.cover, media_type=_detect_mime(book.cover))


@router.post("", response_model=BookOut, status_code=201)
def create_book(
    data: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    book = Book(**data.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return db.query(Book).options(joinedload(Book.genre)).filter(Book.id == book.id).first()
