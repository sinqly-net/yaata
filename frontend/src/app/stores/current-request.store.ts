import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {Request} from 'types/Request';

const initialState: Request = {
  id: '',
  created_at: new Date(),
  updated_at: undefined,
  name: '',
  url: '',
  body: {},
  query_params: [],
  headers: [],
  method: 'GET',
  history: []
}

export const CurrentRequestStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withMethods(store => ({
    setRequest(request: Request) {
      patchState(store, {...request});
    },
    setUrl(url: string | null) {
      if (url) {
        console.log(url)
        patchState(store, {url: url})
      }
    },
    update(update: Partial<Request>) {
      patchState(store, {...update});
    },
    toObject() {
      return {
        id: store.id(),
        created_at: store.created_at(),
        updated_at: store.updated_at?.(),
        name: store.name(),
        url: store.url(),
        body: store.body(),
        query_params: store.query_params(),
        headers: store.headers(),
        method: store.method(),
        history: store.history?.()
      } as Request;
    }
  }))
);
