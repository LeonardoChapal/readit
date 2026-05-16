from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.reading_list import ReadingList
from models.book import Book
from models.user_interest import UserInterest
from schemas.reading_list import ReadingListSet, ReadingListOut
from auth import get_current_user

router = APIRouter(prefix="/api/v1/reading-list", tags=["reading-list"])


def _update_genre_interest(db: Session, user_id: int, book: Book, delta: float = 0.05) -> None:
    if not book.genre_id:
        return
    existing = db.query(UserInterest).filter(
        UserInterest.user_id == user_id,
        UserInterest.entity_type == "genre",
        UserInterest.entity_id == book.genre_id,
    ).first()
    if existing:
        existing.weight = min(float(existing.weight) + delta, 1.0)
    else:
        db.add(UserInterest(
            user_id=user_id,
            entity_type="genre",
            entity_id=book.genre_id,
            weight=0.1,
            source="inferred",
        ))
    db.commit()

VALID_STATUSES = {"want_to_read", "reading", "read"}


@router.get("", response_model=list[ReadingListOut])
def get_my_list(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return (
        db.query(ReadingList)
        .options(joinedload(ReadingList.book).joinedload(Book.genre))
        .filter(ReadingList.user_id == current_user.id)
        .order_by(ReadingList.created_at.desc())
        .all()
    )


@router.get("/{book_id}", response_model=ReadingListOut | None)
def get_book_status(book_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return (
        db.query(ReadingList)
        .options(joinedload(ReadingList.book).joinedload(Book.genre))
        .filter(ReadingList.user_id == current_user.id, ReadingList.book_id == book_id)
        .first()
    )


@router.put("/{book_id}", response_model=ReadingListOut)
def set_book_status(book_id: int, data: ReadingListSet, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if data.status not in VALID_STATUSES:
        raise HTTPException(400, "Estado inválido")

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(404, "Libro no encontrado")

    entry = db.query(ReadingList).filter(
        ReadingList.user_id == current_user.id,
        ReadingList.book_id == book_id,
    ).first()

    if entry:
        entry.status = data.status
    else:
        entry = ReadingList(user_id=current_user.id, book_id=book_id, status=data.status)
        db.add(entry)

    db.commit()
    db.refresh(entry)
    _update_genre_interest(db, current_user.id, book)

    return (
        db.query(ReadingList)
        .options(joinedload(ReadingList.book).joinedload(Book.genre))
        .filter(ReadingList.id == entry.id)
        .first()
    )


@router.delete("/{book_id}", status_code=204)
def remove_book(book_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    entry = db.query(ReadingList).filter(
        ReadingList.user_id == current_user.id,
        ReadingList.book_id == book_id,
    ).first()
    if not entry:
        raise HTTPException(404, "No está en tu lista")
    db.delete(entry)
    db.commit()
