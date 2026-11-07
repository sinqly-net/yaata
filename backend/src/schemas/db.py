from typing import Any, Optional

from pydantic import BaseModel, Field, ConfigDict


class DBConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user: str
    password: str
    host: str
    port: int
    database: str
    db_schema: str = Field(default="public", alias="schema")
    options: Optional[str] = ""

    @property
    def schema(self) -> str:
        return self.db_schema

    def __init__(self, /, **data: Any):
        super().__init__(**data)
        self.options = f"-c search-path={self.db_schema}"
