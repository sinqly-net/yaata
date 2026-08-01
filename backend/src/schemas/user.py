from pydantic import ConfigDict

from schemas.base_schema import BaseSchema


class UserDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str
