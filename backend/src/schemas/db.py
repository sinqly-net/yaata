from typing import Any, Optional

from pydantic import BaseModel


class DBConfig(BaseModel):
    provider: str
    user: str
    password: str
    host: str
    port: int
    database: str
    schema: str
    options: Optional[str] = ""

    def __init__(self, /, **data: Any):
        super().__init__(**data)
        self.options = f"-c search-path={self.schema}"
