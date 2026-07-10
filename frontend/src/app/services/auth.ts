import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AuthConfig} from 'types/Auth';
import {environment} from 'root/environments/environment';
import {OAuthService} from 'angular-oauth2-oidc';

@Service()
export class Auth {
  private oauthService = inject(OAuthService);
  private readonly http = inject(HttpClient);
  private readonly backend_url = environment.backend_url;

  loadAuthConfig(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<AuthConfig>(`${this.backend_url}/auth_config`).subscribe(
        (config: Partial<AuthConfig>) => {
          config.redirectUri = window.location.origin;

          this.oauthService.configure(config);
          this.oauthService.setStorage(sessionStorage);

          this.oauthService
            .loadDiscoveryDocumentAndTryLogin()
            .then(() => {
              if (!this.oauthService.hasValidAccessToken()) {
                this.oauthService.initLoginFlow();
              }
              resolve();
            })
            .catch(reject);
        },
        error => reject(error)
      );
    });
  }
}
