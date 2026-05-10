from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Vote(Base):
    __tablename__ = "vote"
    __table_args__ = (UniqueConstraint("user_id", "review_id", name="uq_vote_user_review"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    review_id: Mapped[int] = mapped_column(Integer, ForeignKey("review.id"), nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="votes")
    review: Mapped["Review"] = relationship("Review", back_populates="votes")
