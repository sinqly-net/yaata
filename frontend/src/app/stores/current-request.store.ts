import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {Request} from 'types/Request';

const initialState: Request = {
  id: '',
  created_at: new Date(),
  updated_at: undefined,
  name: '',
  url: '',
  body: {},
  query_params: {},
  headers: {},
  method: 'GET'
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
    }
  }))
);
