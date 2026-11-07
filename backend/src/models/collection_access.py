from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import BaseTableEntity


class CollectionAccess(BaseTableEntity):
    __tablename__ = "collection_access"

    permissions = Column(String, nullable=False)  # 'read', 'write', 'admin'
    user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="shared_collections", lazy="selectin")
    collection_id: Mapped[UUID] = mapped_column(ForeignKey("collection.id"))
    collection: Mapped["Collection"] = relationship(back_populates="accesses", lazy="selectin")
