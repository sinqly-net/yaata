import {Workspace} from './Workspace';

export type WorkspaceState = {
  isLoading: boolean,
  selectedWorkspace: Workspace,
  permittedWorkspaces: Workspace[],
}
