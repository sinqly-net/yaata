from sqlalchemy import Column, String, JSON, UUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from schemas.methode import HttpMethod
from .db import BaseTableEntity


class Request(BaseTableEntity):
    __tablename__ = "request"
    name = Column(String, nullable=False)
    url = Column(String, nullable=True)
    body = Column(JSON, nullable=True)
    query_params = Column(JSON, nullable=True)
    headers = Column(JSON, nullable=True)
    method = Column(String, default=HttpMethod.GET.value, nullable=False)  # enum HttpMethod
    folder_id: Mapped[UUID] = mapped_column(ForeignKey("folder.id"))
    folder: Mapped["Folder"] = relationship(back_populates="requests")
