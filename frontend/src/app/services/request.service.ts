import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from 'root/environments/environment';
import {Request} from 'types/Request';
import {UUID} from 'types/UUID';

export interface CreateRequestPayload {
  name: string;
  folder_id: UUID;
  method?: string;
  url?: string;
  headers?: any[];
  query_params?: any[];
  body?: any;
}

export interface UpdateRequestPayload {
  name?: string;
  method?: string;
  url?: string;
  headers?: any[];
  query_params?: any[];
  body?: any;
  folder_id?: UUID;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = environment.backend_url;

  createRequest(payload: CreateRequestPayload): Observable<Request> {
    return this.http.post<Request>(`${this.backendUrl}/request`, payload, {
      withCredentials: true
    });
  }

  updateRequest(requestId: UUID, payload: UpdateRequestPayload): Observable<Request> {
    return this.http.put<Request>(`${this.backendUrl}/request/${requestId}`, payload, {
      withCredentials: true
    });
  }

  duplicateRequest(requestId: UUID): Observable<Request> {
    return this.http.post<Request>(`${this.backendUrl}/request/${requestId}/duplicate`, {}, {
      withCredentials: true
    });
  }

  deleteRequest(requestId: UUID): Observable<{ message: string; id: UUID }> {
    return this.http.delete<{ message: string; id: UUID }>(`${this.backendUrl}/request/${requestId}`, {
      withCredentials: true
    });
  }
}
