import {UUID} from './UUID';

export type RequestType = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';

export interface Request {
  id: UUID;
  name: string;
  url: string;
  body: object;
  query_params: object;
  headers: object;
  type: RequestType;
}
