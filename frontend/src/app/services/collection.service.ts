import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from 'root/environments/environment';
import {CollectionAccess, CollectionAccessRights} from 'types/CollectionAccess';
import {UUID} from 'types/UUID';

@Service()
export class CollectionService {
  private http = inject(HttpClient);
  private backendUrl = environment.backend_url;

  shareCollection(collectionId: UUID, email: string, permissions: CollectionAccessRights = 'read'): Observable<CollectionAccess> {
    return this.http.post<CollectionAccess>(
      `${this.backendUrl}/collection/${collectionId}/share`,
      {
        email,
        permissions,
      },
      {
        withCredentials: true,
      }
    );
  }

  getCollectionAccess(collectionId: UUID): Observable<CollectionAccess[]> {
    return this.http.get<CollectionAccess[]>(
      `${this.backendUrl}/collection/${collectionId}/access`,
      {
        withCredentials: true,
      }
    );
  }

  revokeCollectionAccess(collectionId: UUID, userId: UUID): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.backendUrl}/collection/${collectionId}/access/${userId}`,
      {
        withCredentials: true,
      }
    );
  }
}
