import {UUID} from './UUID';
import {Collection} from './Collection';

export interface Workspace {
  id: UUID;
  name: string;
  collections: Collection[];
}
