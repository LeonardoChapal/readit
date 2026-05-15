from sqlalchemy import Integer, String, Text, Boolean, Numeric, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class UserGroup(Base):
    __tablename__ = "user_group"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    criteria: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    memberships: Mapped[list["UserGroupMembership"]] = relationship("UserGroupMembership", back_populates="group")
    affinities: Mapped[list["GroupContentAffinity"]] = relationship("GroupContentAffinity", back_populates="group")


class UserGroupMembership(Base):
    __tablename__ = "user_group_membership"
    __table_args__ = (
        UniqueConstraint("user_id", "group_id", name="uq_ugm_user_group"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_group.id", ondelete="CASCADE"), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric(5, 4), default=1.0, nullable=False)
    method: Mapped[str] = mapped_column(String(20), default="auto", nullable=False)
    assigned_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="group_memberships")
    group: Mapped["UserGroup"] = relationship("UserGroup", back_populates="memberships")


class GroupContentAffinity(Base):
    __tablename__ = "group_content_affinity"
    __table_args__ = (
        UniqueConstraint("group_id", "entity_type", "entity_id", name="uq_gca_group_entity"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_group.id", ondelete="CASCADE"), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(20), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    affinity_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    group: Mapped["UserGroup"] = relationship("UserGroup", back_populates="affinities")
