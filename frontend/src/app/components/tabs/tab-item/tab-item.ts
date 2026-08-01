import {Component, computed, inject, input} from '@angular/core';
import {Tabs} from 'components/tabs/tabs';

@Component({
  selector: 'app-tab-item',
  imports: [],
  templateUrl: './tab-item.html',
  styleUrl: './tab-item.scss',
  providers: []
})
export class TabItem {
  key = input.required<string>();

  private wrapper = inject(Tabs);

  isSelected = computed(() => this.wrapper.selected() === this.key());

  onClick(): void {
    this.wrapper.select(this.key());
  }
}
