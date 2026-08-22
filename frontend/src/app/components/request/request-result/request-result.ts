import {Component} from '@angular/core';
import {RequestResultStatus} from 'components/request/request-result/status/request-result-status';

@Component({
  selector: 'app-request-result',
  imports: [
    RequestResultStatus
  ],
  templateUrl: './request-result.html',
  styleUrl: './request-result.scss',
})
export class RequestResult {

}
