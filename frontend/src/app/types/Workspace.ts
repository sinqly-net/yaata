import {UUID} from './UUID';
import {Collection} from './Collection';

export interface Workspace {
  uuid: UUID;
  name: string;
  collections: Collection[];
}
