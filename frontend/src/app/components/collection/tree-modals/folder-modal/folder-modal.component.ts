import {Component, inject, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FolderService} from 'services/folder.service';
import {UUID} from 'types/UUID';
import {Folder} from 'types/Folder';

@Component({
  selector: 'app-folder-modal',
  imports: [FormsModule],
  templateUrl: './folder-modal.component.html',
  styleUrl: './folder-modal.component.scss',
})
export class FolderModalComponent {
  private readonly folderService = inject(FolderService);

  isOpen = signal<boolean>(false);
  mode = signal<'create' | 'rename'>('create');
  folderId = signal<UUID | null>(null);
  collectionId = signal<UUID | null>(null);
  parentId = signal<UUID | null>(null);
  parentName = signal<string | null>(null);

  name = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  saved = output<Folder>();

  openCreate(collectionId: UUID, parentFolder?: Folder) {
    this.mode.set('create');
    this.folderId.set(null);
    this.collectionId.set(collectionId);
    this.parentId.set(parentFolder?.id ?? null);
    this.parentName.set(parentFolder?.name ?? null);
    this.name.set('');
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  openRename(folder: Folder) {
    this.mode.set('rename');
    this.folderId.set(folder.id);
    this.collectionId.set(null);
    this.parentId.set(null);
    this.parentName.set(null);
    this.name.set(folder.name);
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
      this.errorMessage.set('Bitte gib einen Ordnernamen ein.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.mode() === 'create') {
      const payload: { name: string; collection_id?: UUID; parent_id?: UUID } = {
        name: trimmedName,
      };
      if (this.parentId()) {
        payload.parent_id = this.parentId()!;
      } else if (this.collectionId()) {
        payload.collection_id = this.collectionId()!;
      }

      this.folderService.createFolder(payload).subscribe({
        next: (created) => {
          this.isLoading.set(false);
          this.saved.emit(created);
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Erstellen des Ordners');
        }
      });
    } else {
      const id = this.folderId();
      if (!id) return;

      this.folderService.updateFolder(id, { name: trimmedName }).subscribe({
        next: (updated) => {
          this.isLoading.set(false);
          this.saved.emit(updated);
          this.close();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.detail || 'Fehler beim Umbenennen des Ordners');
        }
      });
    }
  }
}
