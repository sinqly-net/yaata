import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Service()
export class Workspace {
  private readonly http = inject(HttpClient);
}
