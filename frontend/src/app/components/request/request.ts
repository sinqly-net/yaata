import {Component, inject} from '@angular/core';
import {CurrentRequestStore} from 'stores/current-request.store';
import {RequestUrl} from 'components/request/request-url/request-url';

@Component({
  selector: 'app-request',
  imports: [
    RequestUrl
  ],
  templateUrl: './request.html',
  styleUrl: './request.scss',
})
export class Request {
  protected currenRequestStore = inject(CurrentRequestStore);
}
