import {Component, computed, inject, signal} from '@angular/core';
import {CurrentRequestStore} from 'stores/current-request.store';
import {RequestResultStatus} from 'components/request/request-result/status/request-result-status';
import {DatePipe, JsonPipe, KeyValuePipe} from '@angular/common';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {RequestHistory} from 'types/RequestHistory';
import {Tabs} from 'components/tabs/tabs';
import {TabItem} from 'components/tabs/tab-item/tab-item';
import {JsonEditor} from 'components/json-editor/json-editor';
import {getMethodBadgeClass} from 'utils/method-colors';

export type ResultTab = 'body' | 'headers' | 'snapshot' | 'history';
export type BodyViewMode = 'pretty' | 'raw' | 'preview';
export type DetectedResponseType = 'json' | 'xml' | 'html' | 'image' | 'pdf' | 'audio' | 'video' | 'text' | 'binary' | 'empty';

@Component({
  selector: 'app-request-result',
  imports: [
    RequestResultStatus,
    DatePipe,
    JsonPipe,
    Tabs,
    TabItem,
    JsonEditor
  ],
  templateUrl: './request-result.html',
  styleUrl: './request-result.scss',
})
export class RequestResult {
  protected requestStore = inject(CurrentRequestStore);
  private sanitizer = inject(DomSanitizer);

  activeTab = signal<ResultTab>('body');
  viewMode = signal<BodyViewMode>('pretty');
  selectedTypeOverride = signal<DetectedResponseType | null>(null);
  copied = signal<boolean>(false);
  restoredFeedback = signal<boolean>(false);

  result = computed(() => this.requestStore.result());
  historyList = computed(() => this.requestStore.executionHistory());
  isExecuting = computed(() => this.requestStore.isExecuting());
  isHistoryLoading = computed(() => this.requestStore.isHistoryLoading());

  responseHeadersList = computed(() => {
    const res = this.result();
    if (!res || !res.headers) return [];
    return Object.entries(res.headers).map(([key, value]) => ({key, value: String(value)}));
  });

  contentType = computed(() => {
    const headers = this.result()?.headers;
    if (!headers) return '';
    const foundKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
    return foundKey ? String(headers[foundKey]).toLowerCase() : '';
  });

  detectedType = computed<DetectedResponseType>(() => {
    if (this.selectedTypeOverride()) {
      return this.selectedTypeOverride()!;
    }

    const res = this.result();
    if (!res) return 'empty';
    if (res.body === null || res.body === undefined) {
      if (res.error) return 'json';
      return 'empty';
    }

    const ct = this.contentType();

    // 1. Content-Type Header Detection
    if (ct.includes('application/json') || ct.includes('+json')) return 'json';
    if (ct.includes('text/html') || ct.includes('application/xhtml+xml')) return 'html';
    if (ct.includes('application/xml') || ct.includes('text/xml') || ct.includes('+xml')) return 'xml';
    if (ct.includes('image/')) return 'image';
    if (ct.includes('application/pdf')) return 'pdf';
    if (ct.includes('audio/')) return 'audio';
    if (ct.includes('video/')) return 'video';
    if (ct.includes('text/plain') || ct.includes('text/csv') || ct.includes('text/markdown')) return 'text';

    // 2. Content Sniffing Detection
    if (typeof res.body === 'object') {
      return 'json';
    }

    if (typeof res.body === 'string') {
      const trimmed = res.body.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          JSON.parse(trimmed);
          return 'json';
        } catch {
          // not valid json
        }
      }

      if (trimmed.startsWith('data:image/')) {
        return 'image';
      }

      if (trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<!doctype html') || (trimmed.startsWith('<html') && trimmed.includes('</html>'))) {
        return 'html';
      }

      if ((trimmed.startsWith('<?xml') || trimmed.startsWith('<')) && trimmed.endsWith('>')) {
        return 'xml';
      }

      return 'text';
    }

    return 'text';
  });

  formattedBody = computed(() => {
    const res = this.result();
    if (!res) return '';
    if (res.body === null || res.body === undefined) {
      if (res.error) {
        return typeof res.error === 'object' ? JSON.stringify(res.error, null, 2) : String(res.error);
      }
      return '';
    }

    const type = this.detectedType();

    if (typeof res.body === 'object') {
      return JSON.stringify(res.body, null, 2);
    }

    const str = String(res.body);

    if (type === 'json') {
      try {
        const parsed = JSON.parse(str);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return str;
      }
    }

    if (type === 'xml') {
      return this.formatXml(str);
    }

    return str;
  });

  rawBody = computed(() => {
    const res = this.result();
    if (!res) return '';
    if (res.body === null || res.body === undefined) {
      if (res.error) {
        return typeof res.error === 'object' ? JSON.stringify(res.error) : String(res.error);
      }
      return '';
    }
    if (typeof res.body === 'object') {
      return JSON.stringify(res.body);
    }
    return String(res.body);
  });

  responseLanguage = computed(() => {
    if (this.viewMode() === 'raw') return 'plaintext';
    const type = this.detectedType();
    if (type === 'json') return 'json';
    if (type === 'xml') return 'xml';
    if (type === 'html') return 'html';
    return 'plaintext';
  });

  displayBody = computed(() => {
    if (this.viewMode() === 'raw') {
      return this.rawBody();
    }
    return this.formattedBody();
  });

  responseSizeFormatted = computed(() => {
    const raw = this.rawBody();
    if (!raw) return '0 B';
    const bytes = new Blob([raw]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  });

  imageSrc = computed<string | null>(() => {
    if (this.detectedType() !== 'image') return null;
    const res = this.result();
    if (!res || !res.body) return null;
    const str = String(res.body).trim();
    if (str.startsWith('data:image/') || str.startsWith('http://') || str.startsWith('https://')) {
      return str;
    }
    const ct = this.contentType() || 'image/png';
    return `data:${ct};base64,${str}`;
  });

  safeHtmlPreview = computed<SafeResourceUrl | null>(() => {
    if (this.detectedType() !== 'html') return null;
    const str = this.rawBody();
    if (!str) return null;
    return this.sanitizer.bypassSecurityTrustHtml(str);
  });

  selectTab(tab: string | null) {
    if (tab) {
      this.activeTab.set(tab as ResultTab);
    }
  }

  setViewMode(mode: BodyViewMode) {
    this.viewMode.set(mode);
  }

  setTypeOverride(type: DetectedResponseType) {
    this.selectedTypeOverride.set(type);
  }

  selectHistoryItem(item: RequestHistory) {
    this.requestStore.selectHistoryItem(item);
  }

  restoreSnapshot(item: RequestHistory) {
    this.requestStore.restoreSnapshot(item);
    this.restoredFeedback.set(true);
    setTimeout(() => this.restoredFeedback.set(false), 2500);
  }

  copyBody() {
    const text = this.viewMode() === 'raw' ? this.rawBody() : this.formattedBody();
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }

  private formatXml(xml: string): string {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
      formatted += indent + '<' + node + '>\r\n';
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) indent += tab;
    });
    return formatted.substring(1, formatted.length - 3);
  }

  getMethodBadgeClass(method?: string): string {
    return getMethodBadgeClass(method);
  }

  getTypeBadgeClass(type: DetectedResponseType): string {
    switch (type) {
      case 'json': return 'text-amber-300 bg-amber-950/70 border-amber-800/80';
      case 'xml': return 'text-sky-300 bg-sky-950/70 border-sky-800/80';
      case 'html': return 'text-orange-300 bg-orange-950/70 border-orange-800/80';
      case 'image': return 'text-purple-300 bg-purple-950/70 border-purple-800/80';
      case 'pdf': return 'text-rose-300 bg-rose-950/70 border-rose-800/80';
      case 'audio':
      case 'video': return 'text-emerald-300 bg-emerald-950/70 border-emerald-800/80';
      default: return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  }

  getStatusBadgeClass(status: number): string {
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80';
    if (status >= 300 && status < 400) return 'text-cyan-400 bg-cyan-950/70 border-cyan-800/80';
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-950/70 border-amber-800/80';
    return 'text-rose-400 bg-rose-950/70 border-rose-800/80';
  }
}
