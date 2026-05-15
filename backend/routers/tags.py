from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.tag import Tag, BookTag
from models.book import Book
from schemas.tag import TagOut, TagCreate
from auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["tags"])


@router.get("/tags", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db)):
    return db.query(Tag).order_by(Tag.name).all()


@router.post("/tags", response_model=TagOut, status_code=201)
def create_tag(body: TagCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    existing = db.query(Tag).filter(Tag.name == body.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe esta etiqueta")
    tag = Tag(name=body.name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.get("/books/{book_id}/tags", response_model=list[TagOut])
def get_book_tags(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    book_tags = db.query(BookTag).options(joinedload(BookTag.tag)).filter(BookTag.book_id == book_id).all()
    return [bt.tag for bt in book_tags]


@router.post("/books/{book_id}/tags/{tag_id}", status_code=204)
def assign_tag(book_id: int, tag_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    if not db.query(Book).filter(Book.id == book_id).first():
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    if not db.query(Tag).filter(Tag.id == tag_id).first():
        raise HTTPException(status_code=404, detail="Etiqueta no encontrada")
    existing = db.query(BookTag).filter(BookTag.book_id == book_id, BookTag.tag_id == tag_id).first()
    if not existing:
        db.add(BookTag(book_id=book_id, tag_id=tag_id))
        db.commit()


@router.delete("/books/{book_id}/tags/{tag_id}", status_code=204)
def remove_tag(book_id: int, tag_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    bt = db.query(BookTag).filter(BookTag.book_id == book_id, BookTag.tag_id == tag_id).first()
    if bt:
        db.delete(bt)
        db.commit()
