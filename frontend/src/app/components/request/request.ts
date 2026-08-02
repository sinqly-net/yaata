import {Component, inject} from '@angular/core';
import {CurrentRequestStore} from 'stores/current-request.store';
import {FormsModule} from '@angular/forms';
import {RequestConfig} from 'components/request/request-config/request-config';
import {RequestResult} from 'components/request/request-result/request-result';

@Component({
  selector: 'app-request',
  imports: [
    FormsModule,
    RequestConfig,
    RequestResult
  ],
  templateUrl: './request.html',
  styleUrl: './request.scss',
})
export class Request {
  protected currenRequestStore = inject(CurrentRequestStore);
}
