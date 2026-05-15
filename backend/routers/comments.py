from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.comment import Comment
from models.review import Review
from models.user import User
from models.notification import Notification
from schemas.comment import CommentCreate, CommentOut
from auth import get_current_user

router = APIRouter(prefix="/api/v1/reviews", tags=["comments"])
comment_router = APIRouter(prefix="/api/v1/comments", tags=["comments"])


class CommentUpdate(BaseModel):
    content: str


@router.get("/{review_id}/comments", response_model=list[CommentOut])
def list_comments(review_id: int, db: Session = Depends(get_db)):
    if not db.query(Review).filter(Review.id == review_id).first():
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    return (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.review_id == review_id, Comment.status == "active")
        .order_by(Comment.created_at.asc())
        .all()
    )


@router.post("/{review_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(
    review_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.query(Review).filter(Review.id == review_id, Review.status == "active").first():
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    if data.parent_comment_id:
        parent = db.query(Comment).filter(
            Comment.id == data.parent_comment_id,
            Comment.review_id == review_id,
            Comment.status == "active",
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Comentario padre no encontrado")

    comment = Comment(
        user_id=current_user.id,
        review_id=review_id,
        content=data.content,
        parent_comment_id=data.parent_comment_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    review = db.query(Review).filter(Review.id == review_id).first()
    if review and review.user_id != current_user.id:
        db.add(Notification(user_id=review.user_id, actor_id=current_user.id, type="comment", review_id=review_id))
        db.commit()

    return (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.id == comment.id)
        .first()
    )


@comment_router.patch("/{comment_id}", response_model=CommentOut)
def update_comment(
    comment_id: int,
    data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.status == "active").first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este comentario")
    comment.content = data.content
    db.commit()
    return db.query(Comment).options(joinedload(Comment.user)).filter(Comment.id == comment_id).first()


@comment_router.delete("/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.status == "active").first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este comentario")
    comment.status = "deleted"
    db.commit()
