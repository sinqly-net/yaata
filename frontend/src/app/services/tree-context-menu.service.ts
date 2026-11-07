import {Injectable, signal} from '@angular/core';
import {Folder} from 'types/Folder';
import {Request} from 'types/Request';

export interface FolderMenuEvent {
  event: MouseEvent;
  folder: Folder;
}

export interface RequestMenuEvent {
  event: MouseEvent;
  request: Request;
}

@Injectable({
  providedIn: 'root'
})
export class TreeContextMenuService {
  folderMenuEvent = signal<FolderMenuEvent | null>(null);
  requestMenuEvent = signal<RequestMenuEvent | null>(null);

  openFolderMenu(event: MouseEvent, folder: Folder) {
    event.preventDefault();
    event.stopPropagation();
    this.folderMenuEvent.set({ event, folder });
  }

  openRequestMenu(event: MouseEvent, request: Request) {
    event.preventDefault();
    event.stopPropagation();
    this.requestMenuEvent.set({ event, request });
  }

  flattenFolders(folders?: Folder[]): Array<{ id: string; name: string }> {
    if (!folders) return [];
    const result: Array<{ id: string; name: string }> = [];

    const traverse = (list: Folder[], prefix = '') => {
      for (const f of list) {
        result.push({
          id: f.id,
          name: prefix ? `${prefix} / ${f.name}` : f.name
        });
        if (f.folders && f.folders.length > 0) {
          traverse(f.folders, prefix ? `${prefix} / ${f.name}` : f.name);
        }
      }
    };

    traverse(folders);
    return result;
  }
}
