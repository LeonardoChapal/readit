from sqlalchemy import Integer, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class ReadingList(Base):
    __tablename__ = "reading_list"
    __table_args__ = (UniqueConstraint("user_id", "book_id", name="uq_reading_list_user_book"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    book_id: Mapped[int] = mapped_column(Integer, ForeignKey("book.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)  # "want_to_read", "reading", "read"
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="reading_list")
    book: Mapped["Book"] = relationship("Book")
