import {Component, inject, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RequestService} from 'services/request.service';
import {UUID} from 'types/UUID';
import {Request, RequestMethode} from 'types/Request';
import {MethodSelectComponent} from 'components/method-select/method-select.component';

@Component({
  selector: 'app-request-modal',
  imports: [FormsModule, MethodSelectComponent],
  templateUrl: './request-modal.component.html',
  styleUrl: './request-modal.component.scss',
})
export class RequestModalComponent {
  private readonly requestService = inject(RequestService);

  isOpen = signal<boolean>(false);
  mode = signal<'create' | 'rename'>('create');
  requestId = signal<UUID | null>(null);

  name = signal<string>('');
  method = signal<RequestMethode>('GET');
  url = signal<string>('');
  folderId = signal<UUID | null>(null);
  availableFolders = signal<Array<{ id: UUID; name: string }>>([]);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  saved = output<Request>();

  openCreate(folderId: UUID, folders: Array<{ id: UUID; name: string }>) {
    this.mode.set('create');
    this.requestId.set(null);
    this.name.set('');
    this.method.set('GET');
    this.url.set('');
    this.folderId.set(folderId);
    this.availableFolders.set(folders);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  openRename(request: Request) {
    this.mode.set('rename');
    this.requestId.set(request.id);
    this.name.set(request.name);
    this.method.set(request.method || 'GET');
    this.url.set(request.url || '');
    this.folderId.set(null);
    this.availableFolders.set([]);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.errorMessage.set(null);
    this.isLoading.set(false);
  }

  onSubmit() {
    const trimmedName = this.name().trim();
    if (!trimmedName) {
      this.errorMessage.set('Bitte gib einen Namen für die Anfrage ein.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.mode() === 'create') {
      const targetFolder = this.folderId();
      if (!targetFolder) {
        this.errorMessage.set('Bitte wähle einen Zielordner aus.');
        this.isLoading.set(false);
        return;
      }

      this.requestService.createRequest({
        name: trimmedName,
        folder_id: targetFolder,
        method: this.method(),
        url: this.url().trim(),
      }).subscribe({
        next: (created) => {
          this.isLoading.set(false);
          this.saved.emit(created);
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Erstellen der Anfrage');
        }
      });
    } else {
      const reqId = this.requestId();
      if (!reqId) return;

      this.requestService.updateRequest(reqId, {
        name: trimmedName,
      }).subscribe({
        next: (updated) => {
          this.isLoading.set(false);
          this.saved.emit(updated);
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Umbenennen der Anfrage');
        }
      });
    }
  }
}
