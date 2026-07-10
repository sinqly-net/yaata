import {Routes} from '@angular/router';
import {Workspace} from 'components/workspace/workspace';
import {Collection} from 'components/collection/collection';

export const routes: Routes = [
  {
    path: 'workspace',
    children: [
      {
        path: '',
        component: Workspace
      },
      {
        path: 'collection',
        component: Collection,
      }
    ]
  },
];
