import {WorkspaceState} from 'types/WorkspaceState';
import {patchState, signalStore, withMethods, withProps, withState} from '@ngrx/signals';
import {inject} from '@angular/core';
import {WorkspaceService} from "services/workspace";
import {Router} from '@angular/router';
import {UUID} from 'types/UUID';


const initialState: WorkspaceState = {
  isLoading: true,
  permittedWorkspaces: [],
  selectedWorkspace: undefined,
  selectedCollection: undefined,
}

export const GlobalSelectionStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withProps(() => ({
    _workspaceService: inject(WorkspaceService),
    _router: inject(Router)
  })),
  withMethods(store => ({
    init() {
      store._workspaceService.loadUserPermittedWorkspaces().subscribe((data) => {
        if (data && data.length > 0) {
          patchState(store, {
            permittedWorkspaces: data,
          });

          const firstWorkspace = data.at(0);
          if (firstWorkspace && firstWorkspace.workspace) {
            store._router.navigate(['workspace', firstWorkspace.workspace.id]);
          }
        }
      })
    },
    selectWorkspace(id: UUID) {
      const workspace = store.permittedWorkspaces().find(wsa => wsa.workspace.id === id);
      if (!workspace) return undefined;
      patchState(store, {selectedWorkspace: workspace});
      return workspace;
    },
    selectCollection(uuid: UUID) {
      const collection = store.selectedWorkspace?.()?.workspace.collections?.find(collection => collection.id === uuid)
      if (!collection) return undefined;
      patchState(store, {selectedCollection: collection});
      return collection;
    },
  }))
)
