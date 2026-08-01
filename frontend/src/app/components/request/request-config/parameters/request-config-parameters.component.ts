import {Component} from '@angular/core';
import {RequestTabBase} from 'types/RequestTabBase';
import {KeyValueList} from 'components/key-value-list/key-value-list';

@Component({
  selector: 'app-request-config-parameters',
  imports: [
    KeyValueList
  ],
  templateUrl: './request-config-parameters.component.html',
  styleUrl: './request-config-parameters.component.scss',
})
export class RequestConfigParameters extends RequestTabBase {

}
