import {HttpInterceptorFn} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import {environment} from 'root/environments/environment';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const csrfToken = readCookie('csrf_token');
  const headers: Record<string, string> = {};
  if (csrfToken && req.method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return next(
    req.clone({withCredentials: true, setHeaders: headers})
  ).pipe(
    catchError(err => {
      if (err.status === 401) {
        window.location.href = `${environment.backend_url}/auth/login`;
      }
      return throwError(() => err);
    })
  );
};
