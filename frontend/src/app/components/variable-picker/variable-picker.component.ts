import {Component, computed, effect, inject, input, model, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Requesting} from 'services/requesting';
import {Request, RequestMethode} from 'types/Request';
import {Folder} from 'types/Folder';
import {RequestHistory} from 'types/RequestHistory';
import {ExtractedField, extractFieldsFromHistory} from 'utils/variable-parser';

export interface RequestOption {
  request: Request;
  folderPath: string;
  collectionName: string;
}

@Component({
  selector: 'app-variable-picker',
  imports: [
    FormsModule,
  ],
  templateUrl: './variable-picker.component.html',
  styleUrl: './variable-picker.component.scss',
})
export class VariablePickerComponent {
  isOpen = model<boolean>(false);
  initialRequestName = input<string | null>(null);
  initialFieldPath = input<string | null>(null);

  selected = output<{ raw: string; requestName: string; fieldPath: string }>();
  cancelled = output<void>();

  private globalSelection = inject(GlobalSelectionStore);
  private requestingService = inject(Requesting);

  requestSearch = signal<string>('');
  fieldSearch = signal<string>('');
  customFieldInput = signal<string>('');

  selectedRequest = signal<Request | null>(null);
  selectedField = signal<string>('');

  isLoadingHistory = signal<boolean>(false);
  latestHistory = signal<RequestHistory | null>(null);
  hasLoadedHistory = signal<boolean>(false);

  // Alle verfügbaren Requests aus der aktuellen Collection und dem Workspace
  availableRequests = computed<RequestOption[]>(() => {
    const ws = this.globalSelection.selectedWorkspace?.()?.workspace;
    if (!ws || !ws.collections) return [];

    const options: RequestOption[] = [];
    for (const col of ws.collections) {
      if (col.folders) {
        this.collectRequests(col.folders, '', col.name, options);
      }
    }
    return options;
  });

  filteredRequests = computed<RequestOption[]>(() => {
    const q = this.requestSearch().trim().toLowerCase();
    const all = this.availableRequests();
    if (!q) return all;
    return all.filter(opt =>
      opt.request.name.toLowerCase().includes(q) ||
      opt.request.url.toLowerCase().includes(q) ||
      opt.folderPath.toLowerCase().includes(q) ||
      opt.collectionName.toLowerCase().includes(q)
    );
  });

  extractedFields = computed<ExtractedField[]>(() => {
    const hist = this.latestHistory();
    if (!hist) return [];
    return extractFieldsFromHistory(hist);
  });

  filteredFields = computed<ExtractedField[]>(() => {
    const q = this.fieldSearch().trim().toLowerCase();
    const all = this.extractedFields();
    if (!q) return all;
    return all.filter(f =>
      f.path.toLowerCase().includes(q) ||
      f.valuePreview.toLowerCase().includes(q)
    );
  });

  previewVariable = computed<string>(() => {
    const req = this.selectedRequest();
    if (!req) return '';
    const field = this.selectedField() || this.customFieldInput().trim();
    if (!field) return `\${${req.name}}`;
    return `\${${req.name}.${field}}`;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const initReqName = this.initialRequestName();
        if (initReqName) {
          const matched = this.availableRequests().find(r => r.request.name === initReqName);
          if (matched) {
            this.chooseRequest(matched.request);
            if (this.initialFieldPath()) {
              this.selectedField.set(this.initialFieldPath()!);
            }
          }
        }
      } else {
        // Reset state on close
        this.resetState();
      }
    });
  }

  private collectRequests(folders: Folder[], currentPath: string, collectionName: string, out: RequestOption[]) {
    for (const folder of folders) {
      const path = currentPath ? `${currentPath} / ${folder.name}` : folder.name;
      if (folder.requests) {
        for (const req of folder.requests) {
          out.push({
            request: req,
            folderPath: path,
            collectionName,
          });
        }
      }
      if (folder.folders && folder.folders.length > 0) {
        this.collectRequests(folder.folders, path, collectionName, out);
      }
    }
  }

  chooseRequest(request: Request) {
    this.selectedRequest.set(request);
    this.selectedField.set('');
    this.customFieldInput.set('');
    this.fieldSearch.set('');
    this.loadLatestHistory(request.id);
  }

  backToRequests() {
    this.selectedRequest.set(null);
    this.latestHistory.set(null);
    this.hasLoadedHistory.set(false);
    this.selectedField.set('');
    this.customFieldInput.set('');
  }

  private loadLatestHistory(requestId: string) {
    if (!requestId) {
      this.hasLoadedHistory.set(true);
      return;
    }

    this.isLoadingHistory.set(true);
    this.hasLoadedHistory.set(false);
    this.requestingService.getHistory(requestId).subscribe({
      next: (historyList) => {
        this.isLoadingHistory.set(false);
        this.hasLoadedHistory.set(true);
        if (historyList && historyList.length > 0) {
          this.latestHistory.set(historyList[0]);
        } else {
          this.latestHistory.set(null);
        }
      },
      error: () => {
        this.isLoadingHistory.set(false);
        this.hasLoadedHistory.set(true);
        this.latestHistory.set(null);
      }
    });
  }

  selectField(fieldPath: string) {
    this.selectedField.set(fieldPath);
    this.customFieldInput.set('');
  }

  confirmSelection() {
    const req = this.selectedRequest();
    if (!req) return;

    const field = this.selectedField() || this.customFieldInput().trim();
    const raw = field ? `\${${req.name}.${field}}` : `\${${req.name}}`;

    this.selected.emit({
      raw,
      requestName: req.name,
      fieldPath: field,
    });
    this.isOpen.set(false);
  }

  close() {
    this.isOpen.set(false);
    this.cancelled.emit();
  }

  resetState() {
    this.requestSearch.set('');
    this.fieldSearch.set('');
    this.customFieldInput.set('');
    this.selectedRequest.set(null);
    this.selectedField.set('');
    this.latestHistory.set(null);
    this.hasLoadedHistory.set(false);
  }

  getMethodClass(method: RequestMethode | string): string {
    switch (method?.toUpperCase()) {
      case 'GET': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'POST': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PUT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'PATCH': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  }
}
