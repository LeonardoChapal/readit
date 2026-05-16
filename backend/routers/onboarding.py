import traceback

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.genre import Genre
from models.tag import Tag
from models.book import Book
from models.user_interest import UserInterest
from models.user_group import UserGroup, UserGroupMembership
from models.reading_list import ReadingList
from schemas.recommendation import OnboardingComplete
from schemas.genre import GenreOut
from schemas.tag import TagOut
from auth import get_current_user

router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


@router.get("/options")
def get_options(db: Session = Depends(get_db)):
    genres = db.query(Genre).order_by(Genre.name).all()
    tags = db.query(Tag).order_by(Tag.name).all()
    books = db.query(Book).order_by(Book.title).limit(24).all()
    return {
        "genres": [GenreOut.model_validate(g) for g in genres],
        "tags": [TagOut.model_validate(t) for t in tags],
        "books": [{"id": b.id, "title": b.title, "author": b.author, "genre_id": b.genre_id} for b in books],
    }


@router.post("/complete")
def complete_onboarding(
    body: OnboardingComplete,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # 1. Limpiar intereses previos de onboarding
        db.query(UserInterest).filter(
            UserInterest.user_id == current_user.id,
            UserInterest.source == "onboarding",
        ).delete(synchronize_session=False)
        db.flush()

        # 2. Acumular en memoria los intereses deseados (sin duplicados posibles)
        # key = (entity_type, entity_id), value = (weight, source)
        interests: dict[tuple[str, int], tuple[float, str]] = {}

        for genre_id in body.genre_ids:
            interests[("genre", genre_id)] = (1.0, "onboarding")

        for tag_id in body.tag_ids:
            interests[("tag", tag_id)] = (0.8, "onboarding")

        # 3. Procesar libros: agregar a lista de lectura y acumular intereses inferidos
        for book_id in body.book_ids:
            book = db.query(Book).filter(Book.id == book_id).first()
            if not book:
                continue
            entry = db.query(ReadingList).filter(
                ReadingList.user_id == current_user.id,
                ReadingList.book_id == book_id,
            ).first()
            if not entry:
                db.add(ReadingList(user_id=current_user.id, book_id=book_id, status="read"))
            if book.genre_id:
                key = ("genre", book.genre_id)
                if key in interests:
                    w, src = interests[key]
                    interests[key] = (min(w + 0.1, 3.0), src)
                else:
                    interests[key] = (0.1, "inferred")

        # 4. Escribir intereses, haciendo upsert manualmente
        for (etype, eid), (weight, source) in interests.items():
            existing = db.query(UserInterest).filter(
                UserInterest.user_id == current_user.id,
                UserInterest.entity_type == etype,
                UserInterest.entity_id == eid,
            ).first()
            if existing:
                existing.weight = min(float(existing.weight) + 0.1, 3.0)
            else:
                db.add(UserInterest(
                    user_id=current_user.id,
                    entity_type=etype,
                    entity_id=eid,
                    weight=weight,
                    source=source,
                ))

        # 5. Marcar onboarding completado
        current_user.onboarding_completed = True
        if body.preferred_language:
            current_user.preferred_language = body.preferred_language

        db.commit()

        # 6. Asignar a grupo (no crítico, no debe romper onboarding si falla)
        try:
            _assign_group(current_user.id, body.genre_ids, db)
        except Exception as e:
            print(f"[onboarding/_assign_group] {e}")
            traceback.print_exc()

        return {"ok": True}

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en onboarding: {type(e).__name__}: {e}")


def _assign_group(user_id: int, genre_ids: list[int], db: Session):
    if not genre_ids:
        return
    genre = db.query(Genre).filter(Genre.id == genre_ids[0]).first()
    if not genre:
        return

    group_name = f"Lectores de {genre.name}"
    group = db.query(UserGroup).filter(UserGroup.name == group_name).first()
    if not group:
        group = UserGroup(
            name=group_name,
            description=f"Usuarios con interés en {genre.name}",
            criteria={"genre_id": genre_ids[0]},
            is_active=True,
        )
        db.add(group)
        db.flush()

    existing = db.query(UserGroupMembership).filter(
        UserGroupMembership.user_id == user_id,
        UserGroupMembership.group_id == group.id,
    ).first()
    if not existing:
        db.add(UserGroupMembership(
            user_id=user_id,
            group_id=group.id,
            confidence_score=0.9,
            method="rules",
        ))
    db.commit()
