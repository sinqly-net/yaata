from enum import Enum

from pydantic import BaseModel


class DebugLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"


class DebugConfig(BaseModel):
    level: DebugLevel
    format: str


defaultDebugConfig = DebugConfig(
    level=DebugLevel.DEBUG, format="%(levelname)s | %(asctime)s: %(message)s"
)
