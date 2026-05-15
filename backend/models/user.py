from sqlalchemy import Integer, String, Boolean, LargeBinary, DateTime, func
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
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    preferred_language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="user")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="user")
    votes: Mapped[list["Vote"]] = relationship("Vote", back_populates="user")
    reading_list: Mapped[list["ReadingList"]] = relationship("ReadingList", back_populates="user")
    following: Mapped[list["Follow"]] = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower")
    followers: Mapped[list["Follow"]] = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following")
    interests: Mapped[list["UserInterest"]] = relationship("UserInterest", back_populates="user")
    activities: Mapped[list["UserActivity"]] = relationship("UserActivity", back_populates="user")
    group_memberships: Mapped[list["UserGroupMembership"]] = relationship("UserGroupMembership", back_populates="user")
    recommendations: Mapped[list["RecommendationCache"]] = relationship("RecommendationCache", back_populates="user")
