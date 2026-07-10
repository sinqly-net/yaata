import {Component, inject, input} from '@angular/core';
import {Workspace} from 'types/Workspace';
import {TooltipDirective} from 'directive/tooltip.directive';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Router} from '@angular/router';

@Component({
  selector: 'app-workspace-selection-item',
  imports: [
    TooltipDirective
  ],
  templateUrl: './workspace-selection-item.html',
  styleUrl: './workspace-selection-item.scss',
})
export class WorkspaceSelectionItem {
  globalSelectionStore = inject(GlobalSelectionStore);
  workspace = input.required<Workspace>();
  private readonly router = inject(Router);

  protected selectWorkspace() {
    this.globalSelectionStore.selectWorkspace(this.workspace().id);
    this.router.navigate(['workspace']);
  }
}
