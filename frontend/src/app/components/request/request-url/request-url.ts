import {Component, inject} from '@angular/core';
import {RequestMethodes} from 'types/Request';
import {CurrentRequestStore} from 'stores/current-request.store';
import {TitleCasePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-request-url',
  imports: [
    TitleCasePipe,
    FormsModule
  ],
  templateUrl: './request-url.html',
  styleUrl: './request-url.scss',
})
export class RequestUrl {
  protected readonly RequestMethodes = RequestMethodes;
  protected request = inject(CurrentRequestStore);
}
