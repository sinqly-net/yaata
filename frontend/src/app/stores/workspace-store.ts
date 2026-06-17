import {WorkspaceState} from '../types/WorkspaceState';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {UUID} from '../types/UUID';
import {WorkspaceNotFound} from '../exceptions/WorkspaceNotFound';
import {Workspace} from '../types/Workspace';

const initialWorkspace: Workspace = {
  uuid: '',
  name: '',
  collections: []
}

const initialState: WorkspaceState = {
  isLoading: true,
  selectedWorkspace: initialWorkspace,
  permittedWorkspaces: []
}

export const WorkspaceStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withMethods(store => ({
    selectStore(uuid: UUID): void {
      const workspace = store.permittedWorkspaces().find(workspace => workspace.uuid === uuid)
      if (!workspace) throw new WorkspaceNotFound();
      patchState(store, {selectedWorkspace: workspace});
    }
  }))
)
