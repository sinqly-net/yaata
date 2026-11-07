import {patchState, signalStore, withMethods, withProps, withState} from '@ngrx/signals';
import {inject} from '@angular/core';
import {Request, RequestMethode} from 'types/Request';
import {RequestHistory} from 'types/RequestHistory';
import {Requesting} from 'services/requesting';
import {UUID} from 'types/UUID';

interface CurrentRequestState extends Request {
  isExecuting: boolean;
  result: RequestHistory | null;
  executionHistory: RequestHistory[];
  isHistoryLoading: boolean;
  selectedHistoryId: UUID | null;
  errorMessage: string | null;
}

const initialState: CurrentRequestState = {
  id: '',
  created_at: new Date(),
  updated_at: undefined,
  name: '',
  url: '',
  body: {},
  query_params: [],
  headers: [],
  method: 'GET',
  history: [],
  isExecuting: false,
  result: null,
  executionHistory: [],
  isHistoryLoading: false,
  selectedHistoryId: null,
  errorMessage: null,
};

export const CurrentRequestStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withProps(() => ({
    _requesting: inject(Requesting),
  })),
  withMethods(store => ({
    setRequest(request: Request) {
      patchState(store, {
        ...request,
        result: null,
        selectedHistoryId: null,
        errorMessage: null,
      });

      if (request.id) {
        this.loadHistory(request.id);
      } else {
        patchState(store, {executionHistory: []});
      }
    },

    setUrl(url: string | null) {
      if (url !== null && url !== undefined) {
        patchState(store, {url});
      }
    },

    setMethod(method: RequestMethode) {
      patchState(store, {method});
    },

    update(update: Partial<Request>) {
      patchState(store, {...update});
    },

    clear() {
      patchState(store, {
        id: '',
        name: '',
        url: '',
        body: {},
        query_params: [],
        headers: [],
        method: 'GET',
        result: null,
        executionHistory: [],
        selectedHistoryId: null,
        errorMessage: null,
      });
    },

    loadHistory(requestId?: UUID) {
      const id = requestId || store.id();
      if (!id) return;

      patchState(store, {isHistoryLoading: true});
      store._requesting.getHistory(id).subscribe({
        next: (historyList) => {
          patchState(store, {
            executionHistory: historyList || [],
            isHistoryLoading: false,
          });
          if (historyList && historyList.length > 0 && !store.result()) {
            patchState(store, {
              result: historyList[0],
              selectedHistoryId: historyList[0].id,
            });
          }
        },
        error: (err) => {
          console.error('Failed to load request history:', err);
          patchState(store, {isHistoryLoading: false});
        },
      });
    },

    selectHistoryItem(item: RequestHistory) {
      patchState(store, {
        result: item,
        selectedHistoryId: item.id,
      });
    },

    restoreSnapshot(item: RequestHistory) {
      if (!item.request_data) return;
      const data = item.request_data;
      patchState(store, {
        ...(data.url ? {url: data.url} : {}),
        ...(data.method ? {method: data.method as RequestMethode} : {}),
        ...(data.headers ? {headers: data.headers} : {}),
        ...(data.query_params ? {query_params: data.query_params} : {}),
        ...(data.body !== undefined ? {body: data.body} : {}),
      });
    },

    sendRequest() {
      const reqObj: Request = {
        id: store.id(),
        created_at: store.created_at(),
        updated_at: store.updated_at?.(),
        name: store.name(),
        url: store.url(),
        body: store.body(),
        query_params: store.query_params(),
        headers: store.headers(),
        method: store.method(),
      };

      patchState(store, {isExecuting: true, errorMessage: null});

      store._requesting.execute(reqObj).subscribe({
        next: (resultHistory) => {
          const updatedHistory = [resultHistory, ...store.executionHistory().filter(h => h.id !== resultHistory.id)];
          patchState(store, {
            isExecuting: false,
            result: resultHistory,
            executionHistory: updatedHistory,
            selectedHistoryId: resultHistory.id,
          });
        },
        error: (err) => {
          console.error('Request execution error:', err);
          const errorResult: RequestHistory = {
            id: 'error-' + Date.now(),
            ok: false,
            status: err.status || 0,
            status_text: err.statusText || 'Error',
            headers: err.headers || null,
            body: err.error || null,
            error: err.message || err,
            request_id: store.id(),
            duration_ms: 0,
            created_at: new Date(),
            request_data: {
              url: store.url(),
              method: store.method(),
              headers: store.headers(),
              query_params: store.query_params(),
              body: store.body(),
            },
          };
          patchState(store, {
            isExecuting: false,
            result: errorResult,
            errorMessage: err.message || 'Fehler beim Ausführen der Anfrage',
          });
        },
      });
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
        history: store.history?.(),
      } as Request;
    },
  }))
);
