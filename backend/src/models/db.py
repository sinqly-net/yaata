import uuid
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import Column, UUID, DateTime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase

from config import config


class BaseTableEntity(AsyncAttrs, DeclarativeBase):
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.now(), nullable=False)
    updated_at = Column(DateTime, default=datetime.now(), nullable=True)


engine = create_async_engine(
    f"postgresql+asyncpg://{config.db.user}:{config.db.password}@{config.db.host}:{config.db.port}/{config.db.database}",
    pool_pre_ping=True,
    connect_args={'server_settings': {'search_path': config.db.schema}}
)

async_session_factory = async_sessionmaker(
    engine,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
