from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from schemas.workspace_access import WorkspaceAccessRights
from .db import BaseTableEntity


class WorkspaceAccess(BaseTableEntity):
    __tablename__ = "workspaceaccess"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="workspaces", lazy="selectin")
    workspace_id: Mapped[UUID] = mapped_column(ForeignKey("workspace.id"))
    workspace: Mapped["Workspace"] = relationship(back_populates="access", lazy="selectin")
    permissions = Column(String, default=WorkspaceAccessRights.READ.value, nullable=False)  # enum WorkspaceAccessRights
