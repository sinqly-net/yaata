import {inject} from '@angular/core';
import {CanActivateFn} from '@angular/router';
import {Auth} from 'services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return !!auth.currentUser;
};
