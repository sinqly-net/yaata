import {inject, Service} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse} from '@angular/common/http';
import {catchError, map, Observable} from 'rxjs';
import {IRequestResult, Request, RequestMethode} from 'types/Request';
import {TKeyValueList, TValue} from 'types/KeyValue';

@Service()
export class Requesting {
  private http = inject(HttpClient);

  execute<T = unknown>(request: Request): Observable<IRequestResult> {
    const method: RequestMethode = request.method;
    const headers = this.toHttpHeaders(request.headers);
    const params = this.toHttpParams(request.query_params);

    const hasBody = !['GET', 'HEAD', 'TRACE', 'CONNECT'].includes(method);

    return this.http
      .request<T>(method, request.url, {
        body: hasBody ? request.body : undefined,
        headers,
        params,
        observe: 'response',
        responseType: 'json',
      })
      .pipe(
        map((response: HttpResponse<T>) => this.toApiResult<T>(response)),
        catchError((error: HttpErrorResponse) => {
          const result: IRequestResult = {
            ok: false,
            status: error.status,
            statusText: error.statusText,
            headers: error.headers,
            url: error.url,
            body: (error.error as T) ?? null,
            error,
          };
          return [result];
        })
      );
  }

  private toHttpHeaders(list: TKeyValueList): HttpHeaders {
    let headers = new HttpHeaders();
    for (const entry of list ?? []) {
      if (entry.disabled) continue;
      headers = headers.set(entry.key, this.stringifyValue(entry.value));
    }
    return headers;
  }

  private toHttpParams(list: TKeyValueList): HttpParams {
    let params = new HttpParams();
    for (const entry of list ?? []) {
      if (entry.disabled) continue;
      params = params.set(entry.key, this.stringifyValue(entry.value));
    }
    return params;
  }

  private stringifyValue(value: TValue): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private toApiResult<T>(response: HttpResponse<T>): IRequestResult {
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.url,
      body: response.body,
      error: null,
    };
  }

}
