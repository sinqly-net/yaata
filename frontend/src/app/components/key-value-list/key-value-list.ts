import {Component, model} from '@angular/core';
import {RequestKeyValueList} from 'types/Request';
import {KeyValueListItem} from 'components/key-value-list/key-value-list-item/key-value-list-item';

@Component({
  selector: 'app-key-value-list',
  imports: [
    KeyValueListItem
  ],
  templateUrl: './key-value-list.html',
  styleUrl: './key-value-list.scss',
})
export class KeyValueList {
  list = model<RequestKeyValueList>();

  removeItem(remove_index: number) {
    this.list.set(
      (this.list() ?? []).filter((_, index) => index !== remove_index)
    );
  }

  protected addItem() {
    this.list.set([...(this.list() ?? []), {key: '', value: ''}])
  }
}
