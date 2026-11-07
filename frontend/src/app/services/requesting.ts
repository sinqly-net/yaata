import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from 'root/environments/environment';
import {Request} from 'types/Request';
import {RequestHistory} from 'types/RequestHistory';
import {UUID} from 'types/UUID';

@Service()
export class Requesting {
  private http = inject(HttpClient);
  private backendUrl = environment.backend_url;

  execute(request: Request): Observable<RequestHistory> {
    return this.http.post<RequestHistory>(
      `${this.backendUrl}/request/execute`,
      {
        id: request.id,
        name: request.name,
        url: request.url,
        method: request.method,
        headers: request.headers,
        query_params: request.query_params,
        body: request.body,
      },
      {
        withCredentials: true,
      }
    );
  }

  getHistory(requestId: UUID): Observable<RequestHistory[]> {
    return this.http.get<RequestHistory[]>(
      `${this.backendUrl}/request/${requestId}/history`,
      {
        withCredentials: true,
      }
    );
  }

  getHistoryDetail(historyId: UUID): Observable<RequestHistory> {
    return this.http.get<RequestHistory>(
      `${this.backendUrl}/request/history/${historyId}`,
      {
        withCredentials: true,
      }
    );
  }
}
