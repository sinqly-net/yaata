import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from 'root/environments/environment';
import {WorkspaceAccess} from 'types/WorkspaceAccess';

@Service()
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = environment.backend_url;

  loadUserPermittedWorkspaces() {
    return this.http.get<WorkspaceAccess[]>(`${this.backendUrl}/workspace/access`);
  }
}
