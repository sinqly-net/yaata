import {Base} from 'types/Base';

export const RequestMethodes = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'] as const
export type RequestMethode = typeof RequestMethodes[number]

export type RequestValue = string | number | boolean | object;

export interface RequestKeyValue {
  key: string;
  value: RequestValue;
}

export type RequestKeyValueList = RequestKeyValue[];

export interface Request extends Base {
  name: string;
  url: string;
  body: object;
  query_params: object;
  headers: object;
  method: RequestMethode;
}
