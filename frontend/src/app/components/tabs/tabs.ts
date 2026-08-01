import {Component, model} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-tabs',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class Tabs {
  readonly selected = model<string | null>(null);

  select(key: string): void {
    this.selected.set(key);
  }
}
