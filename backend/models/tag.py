from sqlalchemy import Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Tag(Base):
    __tablename__ = "tag"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    books: Mapped[list["BookTag"]] = relationship("BookTag", back_populates="tag")


class BookTag(Base):
    __tablename__ = "book_tag"

    book_id: Mapped[int] = mapped_column(Integer, ForeignKey("book.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(Integer, ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True)

    book: Mapped["Book"] = relationship("Book", back_populates="tags")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="books")
