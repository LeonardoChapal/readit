from sqlalchemy import Integer, String, Numeric, Boolean, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class RecommendationCache(Base):
    __tablename__ = "recommendation_cache"
    __table_args__ = (
        UniqueConstraint("user_id", "book_id", name="uq_rec_user_book"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[int] = mapped_column(Integer, ForeignKey("book.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    reason_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    was_clicked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    served_at: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="recommendations")
    book: Mapped["Book"] = relationship("Book")
