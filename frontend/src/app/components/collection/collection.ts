import {Component, inject} from '@angular/core';
import {Request} from 'components/request/request';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {FolderTree} from 'components/collection/folder-tree/folder-tree';
import {ActivatedRoute, Router} from '@angular/router';

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
  private readonly activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.activatedRoute.params.subscribe(params => {
      const collectionId = params['collection_id'];
      const exists = this.globalSelectionStore.selectCollection(collectionId);
      if (!collectionId || !exists) {
        this.router.navigate(['']);
        return;
      }
    })
  }
}
