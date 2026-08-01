import {Component, inject} from '@angular/core';
import {CurrentRequestStore} from 'stores/current-request.store';
import {FormsModule} from '@angular/forms';
import {RequestConfig} from 'components/request/request-config/request-config';

@Component({
  selector: 'app-request',
  imports: [
    FormsModule,
    RequestConfig
  ],
  templateUrl: './request.html',
  styleUrl: './request.scss',
})
export class Request {
  protected currenRequestStore = inject(CurrentRequestStore);
}
