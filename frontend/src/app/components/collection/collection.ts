import {Component, inject} from '@angular/core';
import {Request} from 'components/request/request';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {FolderTree} from 'components/collection/folder-tree/folder-tree';
import {Router} from '@angular/router';

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
  protected globalSelectionStore = inject(GlobalSelectionStore);
  private readonly router = inject(Router);

  constructor() {
    if (!this.globalSelectionStore.isCollectionSelected()) {
      this.router.navigate(['']);
    }
  }
}
