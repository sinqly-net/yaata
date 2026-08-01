from typing import List

from sqlalchemy import Column, UUID, ForeignKey
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy.sql.sqltypes import String

from .db import BaseTableEntity
from .folder import Folder
from .workspace import Workspace


class Collection(BaseTableEntity):
    __tablename__ = "collection"
    name = Column(String, nullable=False)
    folders: Mapped[List["Folder"]] = relationship(back_populates="collection")
    workspace: Mapped["Workspace"] = relationship('Workspace', back_populates="collections")
    workspace_id: Mapped[UUID] = mapped_column(ForeignKey("workspace.id"))
    workspace: Mapped["Workspace"] = relationship(back_populates="collections")
