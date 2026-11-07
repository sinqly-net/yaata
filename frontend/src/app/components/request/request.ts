import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild
} from '@angular/core';
import {CurrentRequestStore} from 'stores/current-request.store';
import {FormsModule} from '@angular/forms';
import {RequestConfig} from 'components/request/request-config/request-config';
import {RequestResult} from 'components/request/request-result/request-result';

const STORAGE_KEY = 'yaata_request_split_percent';
const DEFAULT_SPLIT_PERCENT = 50;
const MIN_SPLIT_PERCENT = 15;
const MAX_SPLIT_PERCENT = 85;

@Component({
  selector: 'app-request',
  imports: [
    FormsModule,
    RequestConfig,
    RequestResult
  ],
  templateUrl: './request.html',
  styleUrl: './request.scss',
})
export class Request implements OnInit, OnDestroy {
  protected currenRequestStore = inject(CurrentRequestStore);

  splitContainer = viewChild<ElementRef<HTMLDivElement>>('splitContainer');

  splitPercent = signal<number>(DEFAULT_SPLIT_PERCENT);
  isDragging = signal<boolean>(false);

  private boundOnMouseMove = this.onMouseMove.bind(this);
  private boundOnMouseUp = this.onMouseUp.bind(this);
  private boundOnTouchMove = this.onTouchMove.bind(this);
  private boundOnTouchEnd = this.onTouchEnd.bind(this);

  ngOnInit() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const val = parseFloat(saved);
          if (!isNaN(val) && val >= MIN_SPLIT_PERCENT && val <= MAX_SPLIT_PERCENT) {
            this.splitPercent.set(val);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  ngOnDestroy() {
    this.removeDragListeners();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!this.currenRequestStore.isExecuting()) {
        this.currenRequestStore.sendRequest();
      }
    }
  }

  startDragging(event: MouseEvent) {
    event.preventDefault();
    this.isDragging.set(true);
    window.addEventListener('mousemove', this.boundOnMouseMove);
    window.addEventListener('mouseup', this.boundOnMouseUp);
  }

  startDraggingTouch(event: TouchEvent) {
    this.isDragging.set(true);
    window.addEventListener('touchmove', this.boundOnTouchMove, {passive: false});
    window.addEventListener('touchend', this.boundOnTouchEnd);
    window.addEventListener('touchcancel', this.boundOnTouchEnd);
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging()) return;
    this.updateSplitFromClientY(event.clientY);
  }

  private onTouchMove(event: TouchEvent) {
    if (!this.isDragging() || !event.touches.length) return;
    event.preventDefault();
    this.updateSplitFromClientY(event.touches[0].clientY);
  }

  private onMouseUp() {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    this.removeDragListeners();
    this.saveSplitPercent();
    window.dispatchEvent(new Event('resize'));
  }

  private onTouchEnd() {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    this.removeDragListeners();
    this.saveSplitPercent();
    window.dispatchEvent(new Event('resize'));
  }

  private removeDragListeners() {
    window.removeEventListener('mousemove', this.boundOnMouseMove);
    window.removeEventListener('mouseup', this.boundOnMouseUp);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchEnd);
    window.removeEventListener('touchcancel', this.boundOnTouchEnd);
  }

  updateSplitFromClientY(clientY: number) {
    const container = this.splitContainer()?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (rect.height <= 0) return;

    const offsetY = clientY - rect.top;
    let percentage = (offsetY / rect.height) * 100;

    percentage = Math.min(MAX_SPLIT_PERCENT, Math.max(MIN_SPLIT_PERCENT, percentage));
    this.splitPercent.set(Math.round(percentage * 10) / 10);
  }

  resetSplit() {
    this.splitPercent.set(DEFAULT_SPLIT_PERCENT);
    this.saveSplitPercent();
    window.dispatchEvent(new Event('resize'));
  }

  handleSplitterKey(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.splitPercent.update(p => Math.max(MIN_SPLIT_PERCENT, p - 5));
      this.saveSplitPercent();
      window.dispatchEvent(new Event('resize'));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.splitPercent.update(p => Math.min(MAX_SPLIT_PERCENT, p + 5));
      this.saveSplitPercent();
      window.dispatchEvent(new Event('resize'));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.splitPercent.set(MIN_SPLIT_PERCENT);
      this.saveSplitPercent();
      window.dispatchEvent(new Event('resize'));
    } else if (event.key === 'End') {
      event.preventDefault();
      this.splitPercent.set(MAX_SPLIT_PERCENT);
      this.saveSplitPercent();
      window.dispatchEvent(new Event('resize'));
    }
  }

  private saveSplitPercent() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, this.splitPercent().toString());
      }
    } catch {
      // ignore
    }
  }
}
