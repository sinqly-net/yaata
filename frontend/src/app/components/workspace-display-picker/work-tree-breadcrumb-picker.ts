import {Component, inject} from '@angular/core';
import {WorkspaceStore} from '../../stores/workspace-store';

@Component({
  selector: 'app-work-tree-breadcrumb-picker',
  imports: [],
  templateUrl: './work-tree-breadcrumb-picker.html',
  styleUrl: './work-tree-breadcrumb-picker.scss',
})
export class WorkTreeBreadcrumbPicker {
  readonly workspaceStore = inject(WorkspaceStore);
}
