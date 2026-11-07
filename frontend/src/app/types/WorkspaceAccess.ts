import {Workspace} from 'types/Workspace';
import {Base} from 'types/Base';
import {UUID} from 'types/UUID';
import {User} from 'types/User';

export type WorkspaceAccessRights = 'read' | 'write' | 'admin';

export interface WorkspaceAccess extends Base {
  workspace: Workspace;
  permissions?: WorkspaceAccessRights | string;
}

export interface WorkspaceMember extends Base {
  user?: User;
  permissions: WorkspaceAccessRights;
}
