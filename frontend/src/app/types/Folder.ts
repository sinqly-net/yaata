import {UUID} from './UUID';
import {Request} from './Request';

export interface Folder {
  id: UUID;
  name: string;
  folders: Folder[];
  requests: Request[];
}
