import {UUID} from './UUID';

export const RequestMethodes = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'] as const
export type RequestMethode = typeof RequestMethodes[number]

export interface Request {
  id: UUID;
  name: string;
  url: string;
  body: object;
  query_params: object;
  headers: object;
  methode: RequestMethode;
}
