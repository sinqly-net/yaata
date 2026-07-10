export interface AuthConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  responseType: string;
  showDebugInformation: boolean;
  sessionChecksEnabled: boolean;
  useSilentRefresh: boolean;
  redirectUri: string;
}
