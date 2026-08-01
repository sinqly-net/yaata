import {Component, inject, Type} from '@angular/core';
import {CurrentRequestStore} from 'stores/current-request.store';
import {RequestUrl} from 'components/request/request-url/request-url';
import {Tabs} from 'components/tabs/tabs';
import {TabItem} from 'components/tabs/tab-item/tab-item';
import {FormsModule} from '@angular/forms';
import {RequestBody} from 'components/request/request-body/request-body';
import {RequestParameters} from 'components/request/request-parameters/request-parameters';
import {RequestHeaders} from 'components/request/request-headers/request-headers';
import {NgComponentOutlet} from '@angular/common';
import {RequestTabBase} from 'types/RequestTabBase';

const tabConfig: { [key: string]: any } = {
  'body': RequestBody,
  'query_params': RequestParameters,
  'headers': RequestHeaders,
}

@Component({
  selector: 'app-request',
  imports: [
    RequestUrl,
    Tabs,
    TabItem,
    FormsModule,
    NgComponentOutlet
  ],
  templateUrl: './request.html',
  styleUrl: './request.scss',
})
export class Request {
  selectedWorkingTab = 'body'

  protected currenRequestStore = inject(CurrentRequestStore);
  protected currentComponent: Type<RequestTabBase> = tabConfig[this.selectedWorkingTab];

  protected setSelectedWorkingTab($event: string | null) {
    if ($event) {
      this.selectedWorkingTab = $event;
      this.currentComponent = tabConfig[$event];
    }
  }
}
