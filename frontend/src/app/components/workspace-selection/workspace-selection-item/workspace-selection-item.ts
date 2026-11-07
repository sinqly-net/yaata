import {Component, inject, input, output} from '@angular/core';
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
  edit = output<Workspace>();
  share = output<Workspace>();
  private readonly router = inject(Router);

  protected selectWorkspace() {
    this.globalSelectionStore.selectWorkspace(this.workspace().id);
    this.router.navigate(['workspace', this.workspace().id]);
  }

  protected openEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(this.workspace());
  }

  protected openShare(event: Event) {
    event.stopPropagation();
    this.share.emit(this.workspace());
  }
}
