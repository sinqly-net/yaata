import {Component, computed, inject, input} from '@angular/core';
import {KeyValueList} from 'components/key-value-list/key-value-list';
import {IKeyValue} from 'types/KeyValue';
import {VariableInputComponent} from 'components/variable-input/variable-input.component';

@Component({
  selector: 'app-key-value-list-item',
  imports: [
    VariableInputComponent
  ],
  templateUrl: './key-value-list-item.html',
  styleUrl: './key-value-list-item.scss',
})
export class KeyValueListItem {
  item = input.required<IKeyValue>();
  index = input.required<number>();

  private wrapper = inject(KeyValueList);

  isActive = computed(() => !this.item().disabled);

  onKeyInput(newKey: string) {
    this.wrapper.updateItem(this.index(), {key: newKey});
  }

  onValueInput(newValue: string) {
    this.wrapper.updateItem(this.index(), {value: newValue});
  }

  onToggle(checked: boolean) {
    this.wrapper.updateItem(this.index(), {disabled: !checked});
  }

  protected removeItem() {
    this.wrapper.removeItem(this.index());
  }
}
