import {Component, computed, model} from '@angular/core';
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
  list = model<T[]>([]);

  activeCount = computed(() => {
    return (this.list() ?? []).filter(item => !item.disabled).length;
  });

  totalCount = computed(() => {
    return (this.list() ?? []).length;
  });

  removeItem(remove_index: number) {
    const updated = (this.list() ?? []).filter((_, index) => index !== remove_index);
    this.list.set(updated);
  }

  updateItem(index: number, changes: Partial<IKeyValue>) {
    const current = [...(this.list() ?? [])];
    if (current[index]) {
      current[index] = {
        ...current[index],
        ...changes
      };
      this.list.set(current);
    }
  }

  addItem() {
    this.list.set([...(this.list() ?? []), ({key: '', value: '', disabled: false} as T)]);
  }

  clearAll() {
    this.list.set([]);
  }
}
