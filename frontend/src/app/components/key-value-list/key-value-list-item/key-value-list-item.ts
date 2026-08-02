import {Component, inject, input, model} from '@angular/core';
import {KeyValueList} from 'components/key-value-list/key-value-list';
import {FormsModule} from '@angular/forms';
import {TValue} from 'types/KeyValue';

@Component({
  selector: 'app-key-value-list-item',
  imports: [
    FormsModule
  ],
  templateUrl: './key-value-list-item.html',
  styleUrl: './key-value-list-item.scss',
})
export class KeyValueListItem {
  key = model<string>();
  value = model<TValue>();
  index = input.required<number>();
  disabled = input<boolean>(false);

  private wrapper = inject(KeyValueList);

  protected removeItem() {
    this.wrapper.removeItem(this.index());
  }
}
