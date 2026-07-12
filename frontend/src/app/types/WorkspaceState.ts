import {Workspace} from './Workspace';
import {Collection} from 'types/Collection';
import {Request} from 'types/Request';

export type WorkspaceState = {
  isLoading: boolean,
  selectedWorkspace: Workspace,
  selectedCollection: Collection,
  permittedWorkspaces: Workspace[],
  selectedRequest: Request,
}
