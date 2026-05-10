from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.genre import Genre
from schemas.genre import GenreOut

router = APIRouter(prefix="/api/v1/genres", tags=["genres"])


@router.get("", response_model=list[GenreOut])
def list_genres(db: Session = Depends(get_db)):
    return db.query(Genre).order_by(Genre.name).all()
