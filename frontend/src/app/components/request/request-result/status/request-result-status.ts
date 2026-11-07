import {Component, computed, inject} from '@angular/core';
import {CurrentRequestStore} from 'stores/current-request.store';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-request-result-status',
  imports: [
    DatePipe
  ],
  templateUrl: './request-result-status.html',
  styleUrl: './request-result-status.scss',
})
export class RequestResultStatus {
  protected requestStore = inject(CurrentRequestStore);

  result = computed(() => this.requestStore.result());

  statusClass = computed(() => {
    const res = this.result();
    if (!res) return 'text-slate-400 bg-slate-800 border-slate-700';
    if (res.status >= 200 && res.status < 300) {
      return 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80';
    }
    if (res.status >= 300 && res.status < 400) {
      return 'text-cyan-400 bg-cyan-950/70 border-cyan-800/80';
    }
    if (res.status >= 400 && res.status < 500) {
      return 'text-amber-400 bg-amber-950/70 border-amber-800/80';
    }
    return 'text-rose-400 bg-rose-950/70 border-rose-800/80';
  });
}
