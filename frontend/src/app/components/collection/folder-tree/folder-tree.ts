import {Component, inject, input, signal} from '@angular/core';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Folder} from 'types/Folder';
import {RequestItem} from 'components/collection/folder-tree/request-item/request-item';
import {TreeContextMenuService} from 'services/tree-context-menu.service';

@Component({
  selector: 'app-folder-tree',
  imports: [
    RequestItem
  ],
  templateUrl: './folder-tree.html',
  styleUrl: './folder-tree.scss',
})
export class FolderTree {
  globalSelectionStore = inject(GlobalSelectionStore);
  private readonly contextMenuService = inject(TreeContextMenuService);

  folder = input.required<Folder>();
  margin_index = input.required<number>();

  isOpen = signal<boolean>(true);

  toggle() {
    this.isOpen.update((open) => !open);
  }

  onContextMenu(event: MouseEvent) {
    this.contextMenuService.openFolderMenu(event, this.folder());
  }
}
