import {WorkspaceState} from 'types/WorkspaceState';
import {patchState, signalStore, withMethods, withProps, withState} from '@ngrx/signals';
import {inject} from '@angular/core';
import {WorkspaceService} from "services/workspace";
import {Router} from '@angular/router';
import {UUID} from 'types/UUID';
import {WorkspaceAccess} from 'types/WorkspaceAccess';
import {Workspace} from 'types/Workspace';


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
            isLoading: false,
          });

          const firstWorkspace = data.at(0);
          if (firstWorkspace && firstWorkspace.workspace) {
            store._router.navigate(['workspace', firstWorkspace.workspace.id]);
          }
        } else {
          patchState(store, {
            permittedWorkspaces: [],
            isLoading: false,
          });
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
    addWorkspace(workspaceAccess: WorkspaceAccess) {
      patchState(store, {
        permittedWorkspaces: [...store.permittedWorkspaces(), workspaceAccess],
        selectedWorkspace: workspaceAccess,
        selectedCollection: workspaceAccess.workspace.collections?.[0]
      });
      store._router.navigate(['workspace', workspaceAccess.workspace.id]);
    },
    updateWorkspace(updatedWorkspace: Workspace) {
      const updatedList = store.permittedWorkspaces().map(wsa => {
        if (wsa.workspace.id === updatedWorkspace.id) {
          return {
            ...wsa,
            workspace: {
              ...wsa.workspace,
              name: updatedWorkspace.name,
              collections: updatedWorkspace.collections ?? wsa.workspace.collections
            }
          };
        }
        return wsa;
      });

      const selected = store.selectedWorkspace?.();
      const updatedSelected = selected?.workspace.id === updatedWorkspace.id
        ? {
            ...selected,
            workspace: {
              ...selected.workspace,
              name: updatedWorkspace.name,
              collections: updatedWorkspace.collections ?? selected.workspace.collections
            }
          }
        : selected;

      patchState(store, {
        permittedWorkspaces: updatedList,
        selectedWorkspace: updatedSelected
      });
    },
    reloadWorkspaces(targetCollectionId?: UUID) {
      const currentWsId = store.selectedWorkspace?.()?.workspace.id;
      const currentColId = targetCollectionId ?? store.selectedCollection?.()?.id;

      store._workspaceService.loadUserPermittedWorkspaces().subscribe((data) => {
        if (data && data.length > 0) {
          const selectedWs = data.find(wsa => wsa.workspace.id === currentWsId) ?? data[0];
          const selectedCol = selectedWs.workspace.collections?.find(c => c.id === currentColId)
            ?? selectedWs.workspace.collections?.[0];

          patchState(store, {
            permittedWorkspaces: data,
            selectedWorkspace: selectedWs,
            selectedCollection: selectedCol,
            isLoading: false,
          });
        }
      });
    }
  }))
)
