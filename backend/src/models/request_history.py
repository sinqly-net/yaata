from sqlalchemy import UUID, ForeignKey, Column, Boolean, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import BaseTableEntity


class RequestHistory(BaseTableEntity):
    __tablename__ = "request_history"
    ok = Column(Boolean, nullable=False)
    status = Column(Integer, nullable=False)
    status_text = Column(String, nullable=False)
    headers = Column(JSON, nullable=True)
    body = Column(JSON, nullable=True)
    error = Column(JSON, nullable=True)
    request_id: Mapped[UUID] = mapped_column(ForeignKey("request.id"))
    request: Mapped["Request"] = relationship(back_populates="history", lazy="selectin")
