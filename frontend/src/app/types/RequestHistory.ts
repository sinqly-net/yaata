import {UUID} from './UUID';

export interface RequestHistory {
  id: UUID;
  ok: boolean;
  status: number;
  status_text: string;
  headers?: Record<string, string> | null;
  body?: any;
  error?: any;
  request_data?: {
    id?: string;
    name?: string;
    url?: string;
    method?: string;
    headers?: any;
    query_params?: any;
    body?: any;
  } | null;
  duration_ms?: number | null;
  request_id: UUID;
  created_at: string | Date;
  updated_at?: string | Date;
}
