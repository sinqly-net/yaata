import {Component, inject, Type} from '@angular/core';
import {NgComponentOutlet} from "@angular/common";
import {TabItem} from "components/tabs/tab-item/tab-item";
import {Tabs} from "components/tabs/tabs";
import {CurrentRequestStore} from 'stores/current-request.store';
import {RequestTabBase} from 'types/RequestTabBase';
import {RequestConfigBody} from 'components/request/request-config/body/request-config-body.component';
import {
  RequestConfigParameters
} from 'components/request/request-config/parameters/request-config-parameters.component';
import {RequestConfigHeaders} from 'components/request/request-config/headers/request-config-headers.component';
import {RequestConfigUrl} from 'components/request/request-config/url/request-config-url.component';

const tabConfig: { [key: string]: any } = {
  'body': RequestConfigBody,
  'query_params': RequestConfigParameters,
  'headers': RequestConfigHeaders,
}

@Component({
  selector: 'app-request-config',
  imports: [
    NgComponentOutlet,
    TabItem,
    Tabs,
    RequestConfigUrl
  ],
  templateUrl: './request-config.html',
  styleUrl: './request-config.scss',
})
export class RequestConfig {
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
