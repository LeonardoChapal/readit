from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.notification import Notification
from models.user import User
from auth import get_current_user

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = (
        db.query(Notification)
        .options(joinedload(Notification.actor), joinedload(Notification.review))
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": n.id,
            "type": n.type,
            "read": n.read,
            "created_at": n.created_at,
            "actor_username": n.actor.username,
            "review_id": n.review_id,
            "review_title": n.review.title if n.review else None,
        }
        for n in items
    ]


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.read == False
    ).count()
    return {"count": count}


@router.patch("/read-all", status_code=204)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.read == False
    ).update({"read": True})
    db.commit()
