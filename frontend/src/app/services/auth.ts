import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from 'root/environments/environment';
import {User} from 'types/User';
import {catchError, firstValueFrom, of} from 'rxjs';

@Service()
export class Auth {
  currentUser: User | null = null;
  private readonly http = inject(HttpClient);
  private readonly backendUrl = environment.backend_url;

  async init(): Promise<void> {
    const user = await firstValueFrom(
      this.http
        .get<User>(`${this.backendUrl}/auth/me`, {withCredentials: true})
        .pipe(catchError(() => of(null)))
    );

    if (!user) {
      // Echte Navigation, kein XHR - der Browser muss zum IdP redirecten können
      window.location.href = `${this.backendUrl}/auth/login`;
      return;
    }
    this.currentUser = user;
  }

  logout(): void {
    window.location.href = `${this.backendUrl}/auth/logout`;
  }
}
