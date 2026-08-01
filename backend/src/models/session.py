from sqlalchemy import Column, String, DateTime, UUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import BaseTableEntity


class Session(BaseTableEntity):
    __tablename__ = 'session'
    id = Column(String, primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="sessions")
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    id_token = Column(String, nullable=False)
    csrf_token = Column(String, nullable=False)
    access_token_expires_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
