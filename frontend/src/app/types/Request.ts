import {Base} from 'types/Base';
import {TKeyValueList} from 'types/KeyValue';
import {HttpHeaders} from '@angular/common/http';

export const RequestMethodes = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'] as const
export type RequestMethode = typeof RequestMethodes[number]

// Base for FE result when a call is made and the history that is stored in the DB
export interface IRequestResultBase {
  ok: boolean;
  status: number;
  status_text: string;
  headers: HttpHeaders;
  body: unknown | null;
  error: unknown | null;
}

// historic entries, stored in the DB
export interface IRequestHistory extends Base, IRequestResultBase {
  request: Request; // the state the request had when it got executed. field "history" is left out because of performance issues
}

// return value when a call is made in the FE
export interface IRequestResult extends IRequestResultBase {
  url: string | null;
}

// the request stored in DB
export interface Request extends Base {
  name: string;
  url: string;
  body: object;
  query_params: TKeyValueList;
  headers: TKeyValueList;
  method: RequestMethode;
  history?: IRequestHistory[];
}
