from typing import List

from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import BaseTableEntity


class Workspace(BaseTableEntity):
    __tablename__ = "workspace"

    name = Column(String, nullable=False)
    created_user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))

    created_user: Mapped["User"] = relationship(back_populates="workspaces_created")
    access: Mapped[List["WorkspaceAccess"]] = relationship(back_populates="workspace")
    collections: Mapped[List["Collection"]] = relationship(back_populates="workspace")
