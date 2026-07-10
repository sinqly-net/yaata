import {Component, inject, input} from '@angular/core';
import {Collection} from 'types/Collection';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Router} from '@angular/router';

@Component({
  selector: 'app-collection-item',
  imports: [],
  templateUrl: './collection-item.html',
  styleUrl: './collection-item.scss',
})
export class CollectionItem {
  collection = input.required<Collection>();
  protected globalSelectionStore = inject(GlobalSelectionStore);
  private readonly router = inject(Router);

  protected selectCollection() {
    this.globalSelectionStore.selectCollection(this.collection().id);
    this.router.navigate(['workspace/collection']);
  }
}
