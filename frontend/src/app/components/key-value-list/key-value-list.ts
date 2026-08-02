import {Component, model} from '@angular/core';
import {KeyValueListItem} from 'components/key-value-list/key-value-list-item/key-value-list-item';
import {IKeyValue} from 'types/KeyValue';

@Component({
  selector: 'app-key-value-list',
  imports: [
    KeyValueListItem
  ],
  templateUrl: './key-value-list.html',
  styleUrl: './key-value-list.scss',
})
export class KeyValueList<T extends IKeyValue> {
  list = model<T[]>();

  removeItem(remove_index: number) {
    this.list.set(
      (this.list() ?? []).filter((_, index) => index !== remove_index)
    );
  }

  protected addItem() {
    this.list.set([...(this.list() ?? []), ({key: '', value: ''} as T)])
  }
}
