import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from 'root/environments/environment';
import {WorkspaceAccess, WorkspaceAccessRights, WorkspaceMember} from 'types/WorkspaceAccess';
import {Workspace} from 'types/Workspace';
import {UUID} from 'types/UUID';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = environment.backend_url;

  loadUserPermittedWorkspaces(): Observable<WorkspaceAccess[]> {
    return this.http.get<WorkspaceAccess[]>(`${this.backendUrl}/workspace/access`);
  }

  createWorkspace(name: string): Observable<WorkspaceAccess> {
    return this.http.post<WorkspaceAccess>(`${this.backendUrl}/workspace`, { name });
  }

  updateWorkspace(workspaceId: UUID, name: string): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.backendUrl}/workspace/${workspaceId}`, { name });
  }

  getWorkspaceAccess(workspaceId: UUID): Observable<WorkspaceMember[]> {
    return this.http.get<WorkspaceMember[]>(`${this.backendUrl}/workspace/${workspaceId}/access`);
  }

  shareWorkspace(workspaceId: UUID, email: string, permissions: WorkspaceAccessRights = 'read'): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(
      `${this.backendUrl}/workspace/${workspaceId}/share`,
      {
        email,
        permissions
      }
    );
  }

  revokeWorkspaceAccess(workspaceId: UUID, userId: UUID): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.backendUrl}/workspace/${workspaceId}/access/${userId}`
    );
  }
}
