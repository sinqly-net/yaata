from typing import List, Optional

from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .db import BaseTableEntity


class Folder(BaseTableEntity):
    __tablename__ = "folder"
    name = Column(String)

    parent_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("folder.id"))
    parent: Mapped[Optional["Folder"]] = relationship(
        back_populates="folders",
        remote_side="Folder.id",
    )
    folders: Mapped[List["Folder"]] = relationship(back_populates="parent")

    requests: Mapped[List["Request"]] = relationship(back_populates="folder")
    collection_id: Mapped[UUID] = mapped_column(ForeignKey("collection.id"))
    collection: Mapped["Collection"] = relationship(back_populates="folders")
