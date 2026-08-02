import {Component, inject} from '@angular/core';
import {RequestTabBase} from 'types/RequestTabBase';
import {JsonEditor} from 'components/json-editor/json-editor';
import {CurrentRequestStore} from 'stores/current-request.store';

@Component({
  selector: 'app-request-config-body',
  imports: [
    JsonEditor
  ],
  templateUrl: './request-config-body.component.html',
  styleUrl: './request-config-body.component.scss',
})
export class RequestConfigBody extends RequestTabBase {
  protected currenRequestStore = inject(CurrentRequestStore);
}
