import {Component, inject} from '@angular/core';
import {RequestMethodes} from 'types/Request';
import {CurrentRequestStore} from 'stores/current-request.store';
import {TitleCasePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-request-config-url',
  imports: [
    TitleCasePipe,
    FormsModule
  ],
  templateUrl: './request-config-url.component.html',
  styleUrl: './request-config-url.component.scss',
})
export class RequestConfigUrl {
  protected readonly RequestMethodes = RequestMethodes;
  protected request = inject(CurrentRequestStore);
}
