from sqlalchemy import Integer, String, LargeBinary, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Book(Base):
    __tablename__ = "book"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cover: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    genre_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("genre.id"), nullable=True)

    genre: Mapped["Genre"] = relationship("Genre", back_populates="books")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="book")
    tags: Mapped[list["BookTag"]] = relationship("BookTag", back_populates="book")
