import {Component, inject, input} from '@angular/core';
import {Request} from 'types/Request';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {CurrentRequestStore} from 'stores/current-request.store';

@Component({
  selector: 'app-request-item',
  imports: [],
  templateUrl: './request-item.html',
  styleUrl: './request-item.scss',
})
export class RequestItem {
  request = input.required<Request>();
  protected globalSelectionStore = inject(GlobalSelectionStore);
  protected currentRequestStore = inject(CurrentRequestStore);

  selectRequest() {
    this.currentRequestStore.setRequest(this.request());
    this.globalSelectionStore.selectRequest(this.request());
  }
}
