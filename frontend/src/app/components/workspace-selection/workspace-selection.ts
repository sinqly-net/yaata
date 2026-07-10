import {Component, inject} from '@angular/core';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {WorkspaceSelectionItem} from './workspace-selection-item/workspace-selection-item';

@Component({
  selector: 'app-workspace-selection',
  imports: [
    WorkspaceSelectionItem
  ],
  templateUrl: './workspace-selection.html',
  styleUrl: './workspace-selection.scss',
})
export class WorkspaceSelection {
  globalSelectionStore = inject(GlobalSelectionStore);
}
