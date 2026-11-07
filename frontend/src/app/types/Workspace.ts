import {Collection} from './Collection';
import {Base} from 'types/Base';

export interface Workspace extends Base {
  name: string;
  created_by?: string;
  collections?: Collection[];
}
