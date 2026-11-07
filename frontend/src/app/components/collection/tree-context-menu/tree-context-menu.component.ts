import {
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
  viewChild
} from '@angular/core';
import {Folder} from 'types/Folder';
import {Request} from 'types/Request';

export type ContextMenuType = 'folder' | 'request';

@Component({
  selector: 'app-tree-context-menu',
  imports: [],
  templateUrl: './tree-context-menu.component.html',
  styleUrl: './tree-context-menu.component.scss',
})
export class TreeContextMenuComponent {
  private elementRef = inject(ElementRef);

  isOpen = signal<boolean>(false);
  position = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  targetType = signal<ContextMenuType | null>(null);
  targetFolder = signal<Folder | null>(null);
  targetRequest = signal<Request | null>(null);

  // Folder Actions
  createRequestInFolder = output<Folder>();
  createSubfolderInFolder = output<Folder>();
  renameFolderAction = output<Folder>();
  dissolveFolderAction = output<Folder>();
  deleteFolderAction = output<Folder>();

  // Request Actions
  renameRequestAction = output<Request>();
  duplicateRequestAction = output<Request>();
  deleteRequestAction = output<Request>();

  openForFolder(event: MouseEvent, folder: Folder) {
    event.preventDefault();
    event.stopPropagation();
    this.targetType.set('folder');
    this.targetFolder.set(folder);
    this.targetRequest.set(null);
    this.calcPosition(event.clientX, event.clientY);
    this.isOpen.set(true);
  }

  openForRequest(event: MouseEvent, request: Request) {
    event.preventDefault();
    event.stopPropagation();
    this.targetType.set('request');
    this.targetRequest.set(request);
    this.targetFolder.set(null);
    this.calcPosition(event.clientX, event.clientY);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.targetType.set(null);
    this.targetFolder.set(null);
    this.targetRequest.set(null);
  }

  private calcPosition(x: number, y: number) {
    const menuWidth = 210;
    const menuHeight = 220;
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const clampedX = Math.max(10, Math.min(x, windowWidth - menuWidth - 10));
    const clampedY = Math.max(10, Math.min(y, windowHeight - menuHeight - 10));

    this.position.set({ x: clampedX, y: clampedY });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.close();
    }
  }

  triggerCreateRequest() {
    const folder = this.targetFolder();
    if (folder) {
      this.createRequestInFolder.emit(folder);
    }
    this.close();
  }

  triggerCreateSubfolder() {
    const folder = this.targetFolder();
    if (folder) {
      this.createSubfolderInFolder.emit(folder);
    }
    this.close();
  }

  triggerRenameFolder() {
    const folder = this.targetFolder();
    if (folder) {
      this.renameFolderAction.emit(folder);
    }
    this.close();
  }

  triggerDissolveFolder() {
    const folder = this.targetFolder();
    if (folder) {
      this.dissolveFolderAction.emit(folder);
    }
    this.close();
  }

  triggerDeleteFolder() {
    const folder = this.targetFolder();
    if (folder) {
      this.deleteFolderAction.emit(folder);
    }
    this.close();
  }

  triggerRenameRequest() {
    const req = this.targetRequest();
    if (req) {
      this.renameRequestAction.emit(req);
    }
    this.close();
  }

  triggerDuplicateRequest() {
    const req = this.targetRequest();
    if (req) {
      this.duplicateRequestAction.emit(req);
    }
    this.close();
  }

  triggerDeleteRequest() {
    const req = this.targetRequest();
    if (req) {
      this.deleteRequestAction.emit(req);
    }
    this.close();
  }
}
