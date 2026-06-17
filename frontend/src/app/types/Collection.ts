import {Folder} from "./Folder";
import {UUID} from './UUID';

export interface Collection {
  id: UUID;
  name: string;
  folders: Folder[];
}
