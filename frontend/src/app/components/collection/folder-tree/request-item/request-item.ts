import {Component, computed, inject, input} from '@angular/core';
import {Request} from 'types/Request';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {CurrentRequestStore} from 'stores/current-request.store';
import {TreeContextMenuService} from 'services/tree-context-menu.service';
import {getMethodBadgeClass, getMethodShort} from 'utils/method-colors';

@Component({
  selector: 'app-request-item',
  imports: [],
  templateUrl: './request-item.html',
  styleUrl: './request-item.scss',
})
export class RequestItem {
  request = input.required<Request>();
  margin_index = input<number>(0);

  protected globalSelectionStore = inject(GlobalSelectionStore);
  protected currentRequestStore = inject(CurrentRequestStore);
  private readonly contextMenuService = inject(TreeContextMenuService);

  isSelected = computed(() => this.currentRequestStore.id() === this.request().id);

  selectRequest() {
    this.currentRequestStore.setRequest(this.request());
  }

  onContextMenu(event: MouseEvent) {
    this.contextMenuService.openRequestMenu(event, this.request());
  }

  getMethodBadgeClass(method: string): string {
    return getMethodBadgeClass(method);
  }

  getMethodShort(method: string): string {
    return getMethodShort(method);
  }
}
