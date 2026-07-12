import {Component, inject, input} from '@angular/core';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Folder} from 'types/Folder';
import {RequestItem} from 'components/collection/folder-tree/request-item/request-item';

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

  folder = input.required<Folder>();
  margin_index = input.required<number>();
}
