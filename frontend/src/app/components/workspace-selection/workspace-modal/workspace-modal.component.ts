import {Component, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {WorkspaceService} from 'services/workspace';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Workspace} from 'types/Workspace';
import {UUID} from 'types/UUID';

@Component({
  selector: 'app-workspace-modal',
  imports: [
    FormsModule
  ],
  templateUrl: './workspace-modal.component.html',
  styleUrl: './workspace-modal.component.scss',
})
export class WorkspaceModal {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly globalSelectionStore = inject(GlobalSelectionStore);

  isOpen = signal<boolean>(false);
  mode = signal<'create' | 'edit'>('create');
  workspaceId = signal<UUID | null>(null);
  nameInput = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  openCreate() {
    this.mode.set('create');
    this.workspaceId.set(null);
    this.nameInput.set('');
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  openEdit(workspace: Workspace) {
    this.mode.set('edit');
    this.workspaceId.set(workspace.id);
    this.nameInput.set(workspace.name);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.errorMessage.set(null);
  }

  save() {
    const name = this.nameInput().trim();
    if (!name) {
      this.errorMessage.set('Bitte gib einen Namen für den Workspace ein.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.mode() === 'create') {
      this.workspaceService.createWorkspace(name).subscribe({
        next: (workspaceAccess) => {
          this.isLoading.set(false);
          this.globalSelectionStore.addWorkspace(workspaceAccess);
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Erstellen des Workspaces.');
        }
      });
    } else {
      const id = this.workspaceId();
      if (!id) return;

      this.workspaceService.updateWorkspace(id, name).subscribe({
        next: (updatedWorkspace) => {
          this.isLoading.set(false);
          this.globalSelectionStore.updateWorkspace(updatedWorkspace);
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Aktualisieren des Workspaces.');
        }
      });
    }
  }
}
