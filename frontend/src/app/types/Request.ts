import {Base} from 'types/Base';
import {TKeyValueList} from 'types/KeyValue';

export const RequestMethodes = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'] as const
export type RequestMethode = typeof RequestMethodes[number]

export interface Request extends Base {
  name: string;
  url: string;
  body: object;
  query_params: TKeyValueList;
  headers: TKeyValueList;
  method: RequestMethode;
}
