import {Component, inject} from '@angular/core';
import {Request} from 'components/request/request';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {FolderTree} from 'components/collection/folder-tree/folder-tree';

@Component({
  selector: 'app-collection',
  imports: [
    Request,
    FolderTree
  ],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection {
  globalSelectionStore = inject(GlobalSelectionStore);
}
