import {UUID} from 'types/UUID';

export interface Base {
  id: UUID;
  created_at: Date;
  updated_at?: Date;
}
