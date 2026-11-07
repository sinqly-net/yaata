import {Component, inject, output, signal} from '@angular/core';
import {FolderService} from 'services/folder.service';
import {RequestService} from 'services/request.service';
import {Folder} from 'types/Folder';
import {Request} from 'types/Request';
import {UUID} from 'types/UUID';

export type ConfirmActionType = 'delete_folder' | 'dissolve_folder' | 'delete_request';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  private readonly folderService = inject(FolderService);
  private readonly requestService = inject(RequestService);

  isOpen = signal<boolean>(false);
  action = signal<ConfirmActionType | null>(null);
  title = signal<string>('');
  message = signal<string>('');
  confirmButtonText = signal<string>('Bestätigen');
  isDanger = signal<boolean>(true);

  targetFolder = signal<Folder | null>(null);
  targetRequest = signal<Request | null>(null);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  confirmed = output<{ action: ConfirmActionType; id: UUID }>();

  openDeleteFolder(folder: Folder) {
    this.action.set('delete_folder');
    this.targetFolder.set(folder);
    this.targetRequest.set(null);
    this.title.set('Ordner löschen');
    this.message.set(`Möchtest du den Ordner "${folder.name}" und alle darin enthaltenen Unterordner und Anfragen wirklich unwiderruflich löschen?`);
    this.confirmButtonText.set('Ordner löschen');
    this.isDanger.set(true);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  openDissolveFolder(folder: Folder) {
    this.action.set('dissolve_folder');
    this.targetFolder.set(folder);
    this.targetRequest.set(null);
    this.title.set('Ordner auflösen');
    this.message.set(`Möchtest du den Ordner "${folder.name}" auflösen? Alle enthaltenen Anfragen und Unterordner werden in die übergeordnete Ebene verschoben.`);
    this.confirmButtonText.set('Ordner auflösen');
    this.isDanger.set(false);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  openDeleteRequest(request: Request) {
    this.action.set('delete_request');
    this.targetFolder.set(null);
    this.targetRequest.set(request);
    this.title.set('Anfrage löschen');
    this.message.set(`Möchtest du die Anfrage "${request.name}" wirklich löschen? Auch die Ausführungshistorie wird dabei entfernt.`);
    this.confirmButtonText.set('Anfrage löschen');
    this.isDanger.set(true);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.errorMessage.set(null);
    this.isLoading.set(false);
  }

  onConfirm() {
    const act = this.action();
    if (!act) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (act === 'delete_folder') {
      const folder = this.targetFolder();
      if (!folder) return;

      this.folderService.deleteFolder(folder.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.confirmed.emit({ action: act, id: folder.id });
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Löschen des Ordners');
        }
      });
    } else if (act === 'dissolve_folder') {
      const folder = this.targetFolder();
      if (!folder) return;

      this.folderService.dissolveFolder(folder.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.confirmed.emit({ action: act, id: folder.id });
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Auflösen des Ordners');
        }
      });
    } else if (act === 'delete_request') {
      const req = this.targetRequest();
      if (!req) return;

      this.requestService.deleteRequest(req.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.confirmed.emit({ action: act, id: req.id });
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Löschen der Anfrage');
        }
      });
    }
  }
}
