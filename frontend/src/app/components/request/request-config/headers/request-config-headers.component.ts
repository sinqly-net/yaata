import {Component, inject} from '@angular/core';
import {RequestTabBase} from 'types/RequestTabBase';
import {CurrentRequestStore} from 'stores/current-request.store';
import {KeyValueList} from 'components/key-value-list/key-value-list';

@Component({
  selector: 'app-request-config-headers',
  imports: [
    KeyValueList
  ],
  templateUrl: './request-config-headers.component.html',
  styleUrl: './request-config-headers.component.scss',
})
export class RequestConfigHeaders extends RequestTabBase {
  protected currenRequestStore = inject(CurrentRequestStore);

}
