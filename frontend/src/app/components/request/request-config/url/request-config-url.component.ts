import {Component, inject, signal} from '@angular/core';
import {RequestMethodes, RequestMethode} from 'types/Request';
import {CurrentRequestStore} from 'stores/current-request.store';
import {FormsModule} from '@angular/forms';
import {VariableInputComponent} from 'components/variable-input/variable-input.component';
import {MethodSelectComponent} from 'components/method-select/method-select.component';

@Component({
  selector: 'app-request-config-url',
  imports: [
    FormsModule,
    VariableInputComponent,
    MethodSelectComponent,
  ],
  templateUrl: './request-config-url.component.html',
  styleUrl: './request-config-url.component.scss',
})
export class RequestConfigUrl {
  protected readonly RequestMethodes = RequestMethodes;
  protected request = inject(CurrentRequestStore);

  showVariableHelper = signal<boolean>(false);

  toggleVariableHelper() {
    this.showVariableHelper.update(v => !v);
  }

  onMethodChange(newMethod: RequestMethode) {
    this.request.setMethod(newMethod);
  }

  onUrlChange(newUrl: string) {
    this.request.setUrl(newUrl);
  }

  protected sendRequest() {
    this.request.sendRequest();
  }
}
