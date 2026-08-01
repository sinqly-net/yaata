import {Folder} from "./Folder";
import {Base} from 'types/Base';

export interface Collection extends Base {
  name: string;
  folders: Folder[];
}
