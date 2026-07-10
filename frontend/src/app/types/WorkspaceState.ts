import {Workspace} from './Workspace';
import {Collection} from 'types/Collection';

export type WorkspaceState = {
  isLoading: boolean,
  selectedWorkspace: Workspace,
  selectedCollection: Collection,
  permittedWorkspaces: Workspace[],
}
