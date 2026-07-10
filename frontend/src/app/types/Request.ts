import {UUID} from './UUID';

export interface Request {
  id: UUID;
  name: string;
  url: string;
  body: object;
  query_params: object;
  headers: object;
}
