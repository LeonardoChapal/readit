from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user_activity import UserActivity
from schemas.recommendation import ActivityCreate
from auth import get_current_user

router = APIRouter(prefix="/api/v1/activity", tags=["activity"])

VALID_TYPES = {
    "view_book", "write_review", "edit_review", "vote",
    "comment", "add_to_list", "change_list_status",
    "search", "click_recommendation",
}


@router.post("", status_code=204)
def log_activity(
    body: ActivityCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.activity_type not in VALID_TYPES:
        return
    db.add(UserActivity(
        user_id=current_user.id,
        activity_type=body.activity_type,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        metadata_=body.metadata,
        session_id=body.session_id,
    ))
    db.commit()
