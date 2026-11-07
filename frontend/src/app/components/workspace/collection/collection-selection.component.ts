import {Component, inject, output} from '@angular/core';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {CollectionItem} from 'components/workspace/collection/collection-item/collection-item';

@Component({
  selector: 'app-collection-selection',
  imports: [
    CollectionItem,
  ],
  templateUrl: './collection-selection.component.html',
  styleUrl: './collection-selection.component.scss',
})
export class CollectionSelection {
  globalSelectionStore = inject(GlobalSelectionStore);
  share = output<void>();

  onShareClick() {
    this.share.emit();
  }
}
