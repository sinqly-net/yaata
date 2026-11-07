import {Component, computed, inject, Type} from '@angular/core';
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
  selectedWorkingTab = 'body';

  protected currenRequestStore = inject(CurrentRequestStore);
  protected currentComponent: Type<RequestTabBase> = tabConfig[this.selectedWorkingTab];

  activeParamsCount = computed(() => {
    const params = this.currenRequestStore.query_params();
    if (!params) return 0;
    return params.filter(p => !p.disabled && p.key?.trim()).length;
  });

  activeHeadersCount = computed(() => {
    const headers = this.currenRequestStore.headers();
    if (!headers) return 0;
    return headers.filter(h => !h.disabled && h.key?.trim()).length;
  });

  bodyParamsCount = computed(() => {
    const rawBody: any = this.currenRequestStore.body();
    if (rawBody === null || rawBody === undefined) return 0;

    let parsed = rawBody;
    if (typeof rawBody === 'string') {
      const trimmed = rawBody.trim();
      if (!trimmed) return 0;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return 0;
      }
    }

    if (Array.isArray(parsed)) {
      return parsed.length;
    }

    if (typeof parsed === 'object' && parsed !== null) {
      return Object.keys(parsed).length;
    }

    return 0;
  });

  protected setSelectedWorkingTab($event: string | null) {
    if ($event) {
      this.selectedWorkingTab = $event;
      this.currentComponent = tabConfig[$event];
    }
  }
}
