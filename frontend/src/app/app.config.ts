import {ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from 'app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from 'interceptor/auth.interceptor';
import {Auth} from 'services/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      const auth = inject(Auth);
      return auth.init();
    }),
    provideRouter(routes),
  ]
};
