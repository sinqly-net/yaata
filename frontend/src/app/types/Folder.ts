import {UUID} from './UUID';
import {Request} from './Request';
import {Base} from 'types/Base';

export interface Folder extends Base {
  id: UUID;
  name: string;
  folders: Folder[];
  requests: Request[];
}
