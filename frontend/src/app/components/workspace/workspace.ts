import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
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

  constructor() {
    if (!this.globalSelectionStore.isWorkspaceSelected()) {
      this.router.navigate(['']);
    }
  }
}
