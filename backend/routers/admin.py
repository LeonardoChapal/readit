from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.book import Book
from models.review import Review
from models.comment import Comment
from models.genre import Genre
from models.vote import Vote
from models.notification import Notification
from models.reading_list import ReadingList
from schemas.user import UserOut
from schemas.book import BookCreate, BookOut
from schemas.review import ReviewOut
from schemas.comment import CommentOut
from schemas.genre import GenreOut
from auth import require_admin

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


class RoleUpdate(BaseModel):
    role: str


class StatusUpdate(BaseModel):
    status: str


class GenreWrite(BaseModel):
    name: str


# ── Stats ──────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    top_reviews = (
        db.query(Review)
        .options(joinedload(Review.book), joinedload(Review.user))
        .filter(Review.status == "active")
        .order_by(Review.score.desc())
        .limit(5)
        .all()
    )

    top_users = (
        db.query(User, func.count(Review.id).label("count"))
        .join(Review, Review.user_id == User.id)
        .filter(Review.status == "active")
        .group_by(User.id)
        .order_by(func.count(Review.id).desc())
        .limit(5)
        .all()
    )

    recent_reviews = (
        db.query(Review)
        .options(joinedload(Review.book), joinedload(Review.user))
        .filter(Review.status == "active")
        .order_by(Review.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "users":            db.query(User).count(),
        "books":            db.query(Book).count(),
        "reviews":          db.query(Review).filter(Review.status == "active").count(),
        "comments":         db.query(Comment).filter(Comment.status == "active").count(),
        "genres":           db.query(Genre).count(),
        "new_users_month":  db.query(User).filter(User.created_at >= month_start).count(),
        "new_reviews_month": db.query(Review).filter(Review.created_at >= month_start, Review.status == "active").count(),
        "top_reviews": [
            {
                "id": r.id,
                "title": r.title,
                "score": r.score,
                "book_title": r.book.title,
                "username": r.user.username,
            }
            for r in top_reviews
        ],
        "top_users": [
            {"username": u.username, "review_count": count}
            for u, count in top_users
        ],
        "recent_reviews": [
            {
                "id": r.id,
                "title": r.title,
                "book_title": r.book.title,
                "username": r.user.username,
                "created_at": r.created_at.isoformat(),
            }
            for r in recent_reviews
        ],
    }


# ── Usuarios ───────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int, data: RoleUpdate,
    db: Session = Depends(get_db), current: User = Depends(require_admin),
):
    if data.role not in ("user", "admin"):
        raise HTTPException(400, "Rol inválido")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.id == current.id:
        raise HTTPException(400, "No puedes cambiar tu propio rol")
    user.role = data.role
    db.commit()
    db.refresh(user)
    return user


MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


# ── Libros ─────────────────────────────────────────────────────────────────

@router.get("/books", response_model=list[BookOut])
def list_books_admin(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Book).options(joinedload(Book.genre)).order_by(Book.title).all()


@router.post("/books/{book_id}/cover", status_code=204)
async def upload_cover(
    book_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "El archivo debe ser una imagen")
    content = await file.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(400, "La imagen no puede superar 5 MB")
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(404, "Libro no encontrado")
    book.cover = content
    db.commit()


@router.delete("/books/{book_id}/cover", status_code=204)
def delete_cover(
    book_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(404, "Libro no encontrado")
    book.cover = None
    db.commit()


@router.put("/books/{book_id}", response_model=BookOut)
def update_book(
    book_id: int, data: BookCreate,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(404, "Libro no encontrado")
    for k, v in data.model_dump().items():
        setattr(book, k, v)
    db.commit()
    return db.query(Book).options(joinedload(Book.genre)).filter(Book.id == book_id).first()


@router.delete("/books/{book_id}", status_code=204)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(404, "Libro no encontrado")

    # Eliminar dependencias que no tienen ON DELETE CASCADE
    review_ids = [r.id for r in db.query(Review.id).filter(Review.book_id == book_id).all()]
    if review_ids:
        db.query(Notification).filter(Notification.review_id.in_(review_ids)).delete(synchronize_session=False)
        db.query(Vote).filter(Vote.review_id.in_(review_ids)).delete(synchronize_session=False)
        db.query(Comment).filter(Comment.review_id.in_(review_ids)).delete(synchronize_session=False)
        db.query(Review).filter(Review.id.in_(review_ids)).delete(synchronize_session=False)
    db.query(ReadingList).filter(ReadingList.book_id == book_id).delete(synchronize_session=False)

    db.delete(book)
    db.commit()


# ── Reseñas ────────────────────────────────────────────────────────────────

@router.get("/reviews", response_model=list[ReviewOut])
def list_reviews_admin(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return (
        db.query(Review)
        .options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .order_by(Review.created_at.desc())
        .all()
    )


@router.patch("/reviews/{review_id}/status", response_model=ReviewOut)
def update_review_status(
    review_id: int, data: StatusUpdate,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    if data.status not in ("active", "hidden", "deleted"):
        raise HTTPException(400, "Estado inválido")
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Reseña no encontrada")
    review.status = data.status
    db.commit()
    return (
        db.query(Review)
        .options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .filter(Review.id == review_id)
        .first()
    )


# ── Comentarios ────────────────────────────────────────────────────────────

@router.get("/comments", response_model=list[CommentOut])
def list_comments_admin(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .order_by(Comment.created_at.desc())
        .all()
    )


@router.patch("/comments/{comment_id}/status", response_model=CommentOut)
def update_comment_status(
    comment_id: int, data: StatusUpdate,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    if data.status not in ("active", "hidden", "deleted"):
        raise HTTPException(400, "Estado inválido")
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comentario no encontrado")
    comment.status = data.status
    db.commit()
    return (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.id == comment_id)
        .first()
    )


# ── Géneros ────────────────────────────────────────────────────────────────

@router.post("/genres", response_model=GenreOut, status_code=201)
def create_genre(
    data: GenreWrite,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    if db.query(Genre).filter(Genre.name == data.name).first():
        raise HTTPException(400, "El género ya existe")
    genre = Genre(name=data.name)
    db.add(genre)
    db.commit()
    db.refresh(genre)
    return genre


@router.put("/genres/{genre_id}", response_model=GenreOut)
def update_genre(
    genre_id: int, data: GenreWrite,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    genre = db.query(Genre).filter(Genre.id == genre_id).first()
    if not genre:
        raise HTTPException(404, "Género no encontrado")
    genre.name = data.name
    db.commit()
    db.refresh(genre)
    return genre


@router.delete("/genres/{genre_id}", status_code=204)
def delete_genre(
    genre_id: int,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    genre = db.query(Genre).filter(Genre.id == genre_id).first()
    if not genre:
        raise HTTPException(404, "Género no encontrado")
    db.delete(genre)
    db.commit()
