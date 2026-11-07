import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from 'root/environments/environment';
import {Folder} from 'types/Folder';
import {UUID} from 'types/UUID';

export interface CreateFolderPayload {
  name: string;
  collection_id?: UUID;
  parent_id?: UUID;
}

export interface UpdateFolderPayload {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private readonly http = inject(HttpClient);
  private readonly backendUrl = environment.backend_url;

  createFolder(payload: CreateFolderPayload): Observable<Folder> {
    return this.http.post<Folder>(`${this.backendUrl}/folder`, payload, {
      withCredentials: true
    });
  }

  updateFolder(folderId: UUID, payload: UpdateFolderPayload): Observable<Folder> {
    return this.http.put<Folder>(`${this.backendUrl}/folder/${folderId}`, payload, {
      withCredentials: true
    });
  }

  deleteFolder(folderId: UUID): Observable<{ message: string; id: UUID }> {
    return this.http.delete<{ message: string; id: UUID }>(`${this.backendUrl}/folder/${folderId}`, {
      withCredentials: true
    });
  }

  dissolveFolder(folderId: UUID): Observable<{ message: string; id: UUID }> {
    return this.http.post<{ message: string; id: UUID }>(`${this.backendUrl}/folder/${folderId}/dissolve`, {}, {
      withCredentials: true
    });
  }
}
