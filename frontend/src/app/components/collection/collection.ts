import {Component, effect, inject, signal, viewChild} from '@angular/core';
import {Request} from 'components/request/request';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {CurrentRequestStore} from 'stores/current-request.store';
import {FolderTree} from 'components/collection/folder-tree/folder-tree';
import {WorkspaceShareModal} from 'components/workspace-selection/workspace-share-modal/workspace-share-modal.component';
import {CollectionSelection} from 'components/workspace/collection/collection-selection.component';
import {TreeContextMenuComponent} from 'components/collection/tree-context-menu/tree-context-menu.component';
import {RequestModalComponent} from 'components/collection/tree-modals/request-modal/request-modal.component';
import {FolderModalComponent} from 'components/collection/tree-modals/folder-modal/folder-modal.component';
import {ConfirmActionType, ConfirmModalComponent} from 'components/collection/tree-modals/confirm-modal/confirm-modal.component';
import {TreeContextMenuService} from 'services/tree-context-menu.service';
import {RequestService} from 'services/request.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Folder} from 'types/Folder';
import {Request as RequestType} from 'types/Request';
import {UUID} from 'types/UUID';

@Component({
  selector: 'app-collection',
  host: {
    class: 'flex-1 h-full min-h-0 flex flex-col overflow-hidden w-full'
  },
  imports: [
    Request,
    FolderTree,
    WorkspaceShareModal,
    CollectionSelection,
    TreeContextMenuComponent,
    RequestModalComponent,
    FolderModalComponent,
    ConfirmModalComponent
  ],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection {
  protected globalSelectionStore = inject(GlobalSelectionStore);
  protected currentRequestStore = inject(CurrentRequestStore);
  private readonly contextMenuService = inject(TreeContextMenuService);
  private readonly requestService = inject(RequestService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  shareModal = viewChild(WorkspaceShareModal);
  contextMenu = viewChild(TreeContextMenuComponent);
  requestModal = viewChild(RequestModalComponent);
  folderModal = viewChild(FolderModalComponent);
  confirmModal = viewChild(ConfirmModalComponent);

  isSidebarOpen = signal<boolean>(true);

  constructor() {
    this.activatedRoute.params.subscribe(params => {
      const collectionId = params['collection_id'];
      const exists = this.globalSelectionStore.selectCollection(collectionId);
      if (!collectionId || !exists) {
        this.router.navigate(['']);
        return;
      }
    });

    effect(() => {
      const fEvent = this.contextMenuService.folderMenuEvent();
      if (fEvent) {
        this.contextMenu()?.openForFolder(fEvent.event, fEvent.folder);
        this.contextMenuService.folderMenuEvent.set(null);
      }
    });

    effect(() => {
      const rEvent = this.contextMenuService.requestMenuEvent();
      if (rEvent) {
        this.contextMenu()?.openForRequest(rEvent.event, rEvent.request);
        this.contextMenuService.requestMenuEvent.set(null);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen.update(open => !open);
  }

  openShareModal() {
    this.shareModal()?.open();
  }

  openNewRequestModal(targetFolder?: Folder) {
    const folders = this.globalSelectionStore.selectedCollection?.()?.folders;
    const flatFolders = this.contextMenuService.flattenFolders(folders);

    if (flatFolders.length === 0) {
      const colId = this.globalSelectionStore.selectedCollection?.()?.id;
      if (colId) {
        this.folderModal()?.openCreate(colId);
      }
      return;
    }

    const defaultFolderId = (targetFolder?.id ?? flatFolders[0].id) as UUID;
    this.requestModal()?.openCreate(defaultFolderId, flatFolders as Array<{ id: UUID; name: string }>);
  }

  openNewFolderModal(parentFolder?: Folder) {
    const colId = this.globalSelectionStore.selectedCollection?.()?.id;
    if (!colId) return;
    this.folderModal()?.openCreate(colId, parentFolder);
  }

  handleRenameFolder(folder: Folder) {
    this.folderModal()?.openRename(folder);
  }

  handleDissolveFolder(folder: Folder) {
    this.confirmModal()?.openDissolveFolder(folder);
  }

  handleDeleteFolder(folder: Folder) {
    this.confirmModal()?.openDeleteFolder(folder);
  }

  handleRenameRequest(request: RequestType) {
    this.requestModal()?.openRename(request);
  }

  handleDuplicateRequest(request: RequestType) {
    this.requestService.duplicateRequest(request.id).subscribe({
      next: (cloned) => {
        this.globalSelectionStore.reloadWorkspaces();
        this.currentRequestStore.setRequest(cloned);
      }
    });
  }

  handleDeleteRequest(request: RequestType) {
    this.confirmModal()?.openDeleteRequest(request);
  }

  onRequestSaved(req: RequestType) {
    this.globalSelectionStore.reloadWorkspaces();
    this.currentRequestStore.setRequest(req);
  }

  onFolderSaved(folder: Folder) {
    this.globalSelectionStore.reloadWorkspaces();
  }

  onActionConfirmed(event: { action: ConfirmActionType; id: UUID }) {
    if (event.action === 'delete_request' && this.currentRequestStore.id() === event.id) {
      this.currentRequestStore.clear();
    }
    this.globalSelectionStore.reloadWorkspaces();
  }
}
