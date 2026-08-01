from typing import List, Optional

from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .db import BaseTableEntity


class Folder(BaseTableEntity):
    __tablename__ = "folder"
    name = Column(String)

    folders: Mapped[List["Folder"]] = relationship(back_populates="parent", lazy="selectin")
    parent_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("folder.id"))
    parent: Mapped["Folder"] = relationship(
        back_populates="folders",
        remote_side="Folder.id",
        lazy="selectin"
    )

    requests: Mapped[List["Request"]] = relationship(back_populates="folder", lazy="selectin")
    collection_id: Mapped[UUID] = mapped_column(ForeignKey("collection.id"))
    collection: Mapped["Collection"] = relationship(back_populates="folders", lazy="selectin")

    async def load_subtree(self) -> "Folder":
        """
        Load recursive all the child folders and there children.
        """
        children = await self.awaitable_attrs.folders
        for child in children:
            await child.load_subtree()
        return self
