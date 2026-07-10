import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);

  if (oauthService.hasValidAccessToken()) {
    const authReq = req.clone({
      setHeaders: {
        authorization: `Bearer ${oauthService.getAccessToken()}`,
      },
    });

    return next(authReq);
  } else {
    return next(req);
  }
};
