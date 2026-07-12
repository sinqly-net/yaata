import {Component, inject, input} from '@angular/core';
import {Request} from 'types/Request';
import {GlobalSelectionStore} from 'stores/global-selection-store';

@Component({
  selector: 'app-request-item',
  imports: [],
  templateUrl: './request-item.html',
  styleUrl: './request-item.scss',
})
export class RequestItem {
  request = input.required<Request>();
  protected globalSelectionStore = inject(GlobalSelectionStore);
}
