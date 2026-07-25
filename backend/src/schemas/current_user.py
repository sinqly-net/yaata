from dataclasses import dataclass


@dataclass
class CurrentUser:
    id: str
    email: str | None
    name: str | None
