from typing import List

from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import BaseTableEntity


class Workspace(BaseTableEntity):
    __tablename__ = "workspace"

    name = Column(String, nullable=False)

    created_by: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    creation_user: Mapped["User"] = relationship(back_populates="workspaces_created", lazy="selectin")

    access: Mapped[List["WorkspaceAccess"]] = relationship(back_populates="workspace", lazy="selectin")
    collections: Mapped[List["Collection"]] = relationship(back_populates="workspace", lazy="selectin")
