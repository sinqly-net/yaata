import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Service()
export class Workspace {
  private readonly http = inject(HttpClient);

  auth_test() {
    this.http.get('http://localhost:8000/auth_test').subscribe((result) => {
      console.log(result);
    })
  }
}
