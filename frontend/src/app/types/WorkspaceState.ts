import {WorkspaceAccess} from 'types/WorkspaceAccess';
import {Collection} from 'types/Collection';

export type WorkspaceState = {
  isLoading: boolean,
  permittedWorkspaces: WorkspaceAccess[],
  selectedWorkspace?: WorkspaceAccess,
  selectedCollection?: Collection;
}
