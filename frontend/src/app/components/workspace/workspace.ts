import {Component, inject, viewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {CollectionSelection} from 'components/workspace/collection/collection-selection.component';
import {WorkspaceModal} from 'components/workspace-selection/workspace-modal/workspace-modal.component';

@Component({
  selector: 'app-workspace',
  imports: [
    CollectionSelection,
    WorkspaceModal,
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
})
export class Workspace {
  protected globalSelectionStore = inject(GlobalSelectionStore);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  modal = viewChild(WorkspaceModal);

  constructor() {
    this.activatedRoute.params.subscribe(params => {
      const workspaceId = params['workspace_id'];
      const exists = this.globalSelectionStore.selectWorkspace(workspaceId);
      if (!workspaceId || !exists) {
        this.router.navigate(['']);
        return;
      }
      const collections = exists.workspace?.collections;
      if (collections && collections.length > 0) {
        const selectedCol = this.globalSelectionStore.selectedCollection?.() || collections[0];
        this.globalSelectionStore.selectCollection(selectedCol.id);
        this.router.navigate(['workspace', workspaceId, 'collection', selectedCol.id]);
      }
    });
  }

  openEditModal() {
    const ws = this.globalSelectionStore.selectedWorkspace?.()?.workspace;
    if (ws) {
      this.modal()?.openEdit(ws);
    }
  }
}
