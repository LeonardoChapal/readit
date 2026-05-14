from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from database import get_db
from models.user import User
from models.book import Book
from models.genre import Genre
from models.review import Review
from models.comment import Comment
from models.follow import Follow
from schemas.review import ReviewOut
from schemas.user import UserOut, UserUpdate
from auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/v1/users", tags=["users"])

MAX_AVATAR_BYTES = 5 * 1024 * 1024


def _detect_mime(data: bytes) -> str:
    if data[:3] == b'\xff\xd8\xff': return "image/jpeg"
    if data[:4] == b'\x89PNG': return "image/png"
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP': return "image/webp"
    return "image/jpeg"


@router.get("/{username}/avatar")
def get_avatar(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.avatar:
        raise HTTPException(status_code=404, detail="Sin avatar")
    return Response(content=user.avatar, media_type=_detect_mime(user.avatar))


@router.post("/me/avatar", status_code=204)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    data = await file.read()
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")
    current_user.avatar = data
    db.commit()


@router.delete("/me/avatar", status_code=204)
def delete_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.avatar = None
    db.commit()


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Debes proporcionar tu contraseña actual para cambiarla")
        if not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    if data.username and data.username != current_user.username:
        if db.query(User).filter(User.username == data.username).first():
            raise HTTPException(status_code=400, detail="Ese nombre de usuario ya está en uso")
        current_user.username = data.username

    if data.email and data.email != current_user.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Ese correo ya está registrado")
        current_user.email = data.email

    if data.new_password:
        current_user.password_hash = hash_password(data.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{username}/stats")
def get_user_stats(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.user_id == user.id, Review.status == "active", Review.rating.isnot(None)
    ).scalar()

    total_votes = db.query(func.sum(Review.score)).filter(
        Review.user_id == user.id, Review.status == "active"
    ).scalar()

    genre_row = (
        db.query(Genre.name, func.count(Review.id).label("cnt"))
        .join(Book, Book.genre_id == Genre.id)
        .join(Review, Review.book_id == Book.id)
        .filter(Review.user_id == user.id, Review.status == "active")
        .group_by(Genre.name)
        .order_by(func.count(Review.id).desc())
        .first()
    )

    return {
        "avg_rating_given": round(float(avg_rating), 1) if avg_rating else None,
        "total_votes_received": int(total_votes) if total_votes else 0,
        "favorite_genre": genre_row[0] if genre_row else None,
    }


@router.get("/{username}/is-following")
def is_following(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    exists = db.query(Follow).filter(
        Follow.follower_id == current_user.id, Follow.following_id == target.id
    ).first()
    return {"is_following": exists is not None}


@router.get("/{username}")
def get_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    review_count = db.query(Review).filter(Review.user_id == user.id, Review.status == "active").count()
    comment_count = db.query(Comment).filter(Comment.user_id == user.id, Comment.status == "active").count()
    follower_count = db.query(Follow).filter(Follow.following_id == user.id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user.id).count()

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "created_at": user.created_at,
        "review_count": review_count,
        "comment_count": comment_count,
        "follower_count": follower_count,
        "following_count": following_count,
    }


@router.post("/{username}/follow", status_code=204)
def follow_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes seguirte a ti mismo")

    exists = db.query(Follow).filter(
        Follow.follower_id == current_user.id, Follow.following_id == target.id
    ).first()
    if not exists:
        db.add(Follow(follower_id=current_user.id, following_id=target.id))
        db.commit()


@router.delete("/{username}/follow", status_code=204)
def unfollow_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id, Follow.following_id == target.id
    ).first()
    if follow:
        db.delete(follow)
        db.commit()


@router.get("/{username}/reviews", response_model=list[ReviewOut])
def get_user_reviews(username: str, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return (
        db.query(Review)
        .options(joinedload(Review.book).joinedload(Book.genre), joinedload(Review.user))
        .filter(Review.user_id == user.id, Review.status == "active")
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
