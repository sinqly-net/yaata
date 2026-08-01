from typing import List

from sqlalchemy import Column, String
from sqlalchemy.orm import Mapped, relationship

from .db import BaseTableEntity


class User(BaseTableEntity):
    __tablename__ = "user"

    email = Column(String, nullable=False)
    name = Column(String, nullable=False)

    sessions: Mapped[List["Session"]] = relationship(back_populates="user", lazy="selectin")
    workspaces: Mapped[List["WorkspaceAccess"]] = relationship(back_populates="user", lazy="selectin")
    workspaces_created: Mapped[List["Workspace"]] = relationship(back_populates="creation_user", lazy="selectin")
