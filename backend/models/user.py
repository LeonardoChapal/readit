from sqlalchemy import Integer, String, LargeBinary, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    role: Mapped[str] = mapped_column(String(10), default="user", nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="user")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="user")
    votes: Mapped[list["Vote"]] = relationship("Vote", back_populates="user")
