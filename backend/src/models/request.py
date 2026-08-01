from pony.orm import Required, Optional
from pony.orm.ormtypes import Json

from models import db, BaseTableEntity
from models.folder import Folder
from schemas.methode import HttpMethod


class Request(db.Entity, metaclass=BaseTableEntity):
    name = Required(str)
    url = Optional(str, nullable=True)
    body = Optional(Json, nullable=True)
    query_params = Optional(Json, nullable=True)
    headers = Optional(Json, nullable=True)
    method = Required(str, default=HttpMethod.GET.value)  # enum HttpMethod
    folder_id = Required(Folder)
