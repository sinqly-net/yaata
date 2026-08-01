from pony.orm import Required, Set, Optional

from models import db, BaseTableEntity


class Folder(db.Entity, metaclass=BaseTableEntity):
    name = Required(str)
    folders = Set('Folder')
    parent_id = Optional('Folder')
    requests = Set('Request')
    collection_id = Required('Collection')
