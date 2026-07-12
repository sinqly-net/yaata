import {WorkspaceState} from 'types/WorkspaceState';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {UUID} from 'types/UUID';
import {WorkspaceNotFound} from 'exceptions/WorkspaceNotFound';
import {Workspace} from 'types/Workspace';
import {Collection} from 'types/Collection';
import {CollectionNotFound} from 'exceptions/CollectionNotFound';
import {Request} from 'types/Request';

const initialWorkspace: Workspace = {
  id: '',
  name: '',
  collections: []
}

const initialCollection: Collection = {
  id: '',
  name: '',
  folders: []
}

const initialRequest: Request = {
  id: '',
  name: '',
  url: '',
  body: {},
  query_params: {},
  headers: {},
  type: 'GET'
}

const initialState: WorkspaceState = {
  isLoading: true,
  selectedWorkspace: initialWorkspace,
  selectedCollection: initialCollection,
  selectedRequest: initialRequest,
  permittedWorkspaces: [
    {
      id: '1',
      name: 'Num 1',
      collections: [
        {
          id: '3',
          name: 'Collection 3',
          folders: [
            {
              id: '10',
              name: 'folder 10',
              folders: [
                {
                  id: '11',
                  name: 'folder 11',
                  folders: [],
                  requests: [
                    {
                      id: '13',
                      name: 'Get Docs',
                      url: 'http://localhost:8000/docs',
                      body: {},
                      query_params: {},
                      headers: {},
                      type: 'GET'
                    }
                  ]
                }
              ],
              requests: []
            },
            {
              id: '12',
              name: 'folder 12',
              folders: [],
              requests: []
            }
          ]
        },
        {
          id: '4',
          name: 'Collection 4',
          folders: []
        },
        {
          id: '5',
          name: 'Collection 5',
          folders: []
        },
        {
          id: '6',
          name: 'Collection 6',
          folders: []
        },
        {
          id: '7',
          name: 'Collection 7',
          folders: []
        },
        {
          id: '8',
          name: 'Collection 8',
          folders: []
        },
        {
          id: '9',
          name: 'Collection 9',
          folders: []
        },
      ]
    },
    {
      id: '2',
      name: 'Num 2',
      collections: []
    }
  ]
}

export const GlobalSelectionStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withMethods(store => ({
    selectWorkspace(uuid: UUID): void {
      const workspace = store.permittedWorkspaces().find(workspace => workspace.id === uuid)
      if (!workspace) throw new WorkspaceNotFound();
      patchState(store, {selectedWorkspace: workspace});
    },
    isWorkspaceSelectedByID(uuid: UUID): boolean {
      return store.selectedWorkspace().id === uuid;
    },
    isWorkspaceSelected(): boolean {
      return store.selectedWorkspace().id !== '';
    },
    selectCollection(uuid: UUID): void {
      const collection = store.selectedWorkspace().collections.find(collection => collection.id === uuid)
      if (!collection) throw new CollectionNotFound();
      patchState(store, {selectedCollection: collection});
    },
    isCollectionSelected(): boolean {
      return store.selectedCollection().id !== '';
    },
    selectRequest(request: Request): void {
      // Because requests can be in a folder of a folder etc. the request is directly used instead of the id
      patchState(store, {selectedRequest: request});
    }
  }))
)
