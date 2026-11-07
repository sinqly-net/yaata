import {Component, effect, inject, signal} from '@angular/core';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {WorkspaceService} from 'services/workspace';
import {WorkspaceAccessRights, WorkspaceMember} from 'types/WorkspaceAccess';
import {Workspace} from 'types/Workspace';
import {UUID} from 'types/UUID';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-workspace-share-modal',
  imports: [
    FormsModule
  ],
  templateUrl: './workspace-share-modal.component.html',
  styleUrl: './workspace-share-modal.component.scss',
})
export class WorkspaceShareModal {
  protected globalSelectionStore = inject(GlobalSelectionStore);
  private workspaceService = inject(WorkspaceService);

  isOpen = signal<boolean>(false);
  targetWorkspace = signal<Workspace | null>(null);
  emailInput = signal<string>('');
  selectedPermission = signal<WorkspaceAccessRights>('read');
  accessList = signal<WorkspaceMember[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const ws = this.targetWorkspace() || this.globalSelectionStore.selectedWorkspace?.()?.workspace;
      if (this.isOpen() && ws?.id) {
        this.loadAccessList(ws.id);
      }
    });
  }

  open(workspace?: Workspace) {
    const ws = workspace || this.globalSelectionStore.selectedWorkspace?.()?.workspace || null;
    this.targetWorkspace.set(ws);
    this.isOpen.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  close() {
    this.isOpen.set(false);
  }

  get currentWorkspace(): Workspace | null {
    return this.targetWorkspace() || this.globalSelectionStore.selectedWorkspace?.()?.workspace || null;
  }

  loadAccessList(workspaceId: UUID) {
    this.isLoading.set(true);
    this.workspaceService.getWorkspaceAccess(workspaceId).subscribe({
      next: (list) => {
        this.accessList.set(list || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load workspace access list:', err);
        this.isLoading.set(false);
      },
    });
  }

  shareWorkspace() {
    const email = this.emailInput().trim();
    const ws = this.currentWorkspace;
    if (!email || !ws?.id) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.workspaceService.shareWorkspace(ws.id, email, this.selectedPermission()).subscribe({
      next: () => {
        this.emailInput.set('');
        this.successMessage.set(`Workspace erfolgreich für ${email} freigegeben.`);
        this.loadAccessList(ws.id);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail || 'Fehler beim Teilen des Workspaces');
      },
    });
  }

  revokeAccess(userId?: UUID) {
    const ws = this.currentWorkspace;
    if (!userId || !ws?.id) return;

    this.isLoading.set(true);
    this.workspaceService.revokeWorkspaceAccess(ws.id, userId).subscribe({
      next: () => {
        this.loadAccessList(ws.id);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail || 'Fehler beim Entfernen des Zugriffs');
      },
    });
  }
}
