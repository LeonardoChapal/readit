from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Notification(Base):
    __tablename__ = "notification"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    actor_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)  # "comment" | "vote" | "follow"
    review_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("review.id"), nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    actor: Mapped["User"] = relationship("User", foreign_keys=[actor_id])
    review: Mapped["Review"] = relationship("Review", foreign_keys=[review_id])
