import {Component, inject, input} from '@angular/core';
import {Collection} from 'types/Collection';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Router} from '@angular/router';
import {Workspace} from 'types/Workspace';

@Component({
  selector: 'app-collection-item',
  imports: [],
  templateUrl: './collection-item.html',
  styleUrl: './collection-item.scss',
})
export class CollectionItem {
  collection = input.required<Collection>();
  workspace = input.required<Workspace>();
  protected globalSelectionStore = inject(GlobalSelectionStore);
  private readonly router = inject(Router);

  protected selectCollection() {
    const exists = this.globalSelectionStore.selectCollection(this.collection().id);
    if (exists) {
      this.router.navigate(['workspace', this.workspace().id, 'collection', this.collection().id]);
    } else {
      this.router.navigate(['workspace']);
    }
  }
}
