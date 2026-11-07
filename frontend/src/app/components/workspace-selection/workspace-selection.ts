import {Component, inject, viewChild} from '@angular/core';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {WorkspaceSelectionItem} from './workspace-selection-item/workspace-selection-item';
import {WorkspaceModal} from './workspace-modal/workspace-modal.component';
import {WorkspaceShareModal} from './workspace-share-modal/workspace-share-modal.component';
import {TooltipDirective} from 'directive/tooltip.directive';
import {Workspace} from 'types/Workspace';

@Component({
  selector: 'app-workspace-selection',
  imports: [
    WorkspaceSelectionItem,
    WorkspaceModal,
    WorkspaceShareModal,
    TooltipDirective,
  ],
  templateUrl: './workspace-selection.html',
  styleUrl: './workspace-selection.scss',
})
export class WorkspaceSelection {
  globalSelectionStore = inject(GlobalSelectionStore);
  modal = viewChild(WorkspaceModal);
  shareModal = viewChild(WorkspaceShareModal);

  openCreate() {
    this.modal()?.openCreate();
  }

  openEdit(workspace: Workspace) {
    this.modal()?.openEdit(workspace);
  }

  openShare(workspace: Workspace) {
    this.shareModal()?.open(workspace);
  }
}
