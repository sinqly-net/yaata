import {Component, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {CollectionSelection} from 'components/workspace/collection/collection-selection.component';

@Component({
  selector: 'app-workspace',
  imports: [
    CollectionSelection
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
})
export class Workspace {
  protected globalSelectionStore = inject(GlobalSelectionStore);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.activatedRoute.params.subscribe(params => {
      const workspaceId = params['workspace_id'];
      const exists = this.globalSelectionStore.selectWorkspace(workspaceId);
      if (!workspaceId || !exists) {
        this.router.navigate(['']);
        return;
      }
    })
  }
}
