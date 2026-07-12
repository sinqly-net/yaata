import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {inject} from '@angular/core';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Request} from 'types/Request';

export const CurrentRequestStore = signalStore(
  {providedIn: 'root'},
  withState(() => {
    const globalSelectionStore = inject(GlobalSelectionStore);
    return globalSelectionStore.selectedRequest();
  }),
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
