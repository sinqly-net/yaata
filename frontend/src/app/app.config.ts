import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from 'app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {OAuthModule, provideOAuthClient} from 'angular-oauth2-oidc';
import {Auth} from 'services/auth';
import {authInterceptor} from 'interceptor/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(OAuthModule.forRoot()),
    provideOAuthClient(),
    provideAppInitializer(() => {
      const initFn = ((authService: Auth) => {
        return () => authService.loadAuthConfig();
      })(inject(Auth));
      return initFn();
    }),
  ]
};
