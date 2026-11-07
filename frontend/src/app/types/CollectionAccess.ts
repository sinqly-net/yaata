import {UUID} from './UUID';
import {User} from './User';

export type CollectionAccessRights = 'read' | 'write' | 'admin';

export interface CollectionAccess {
  id: UUID;
  user?: User;
  permissions: CollectionAccessRights;
  created_at?: string | Date;
  updated_at?: string | Date;
}
