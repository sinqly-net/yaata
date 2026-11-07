import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal
} from '@angular/core';
import {RequestMethodes, RequestMethode} from 'types/Request';
import {getMethodBadgeClass, getMethodSelectClass, getMethodTextColorClass} from 'utils/method-colors';

@Component({
  selector: 'app-method-select',
  imports: [],
  templateUrl: './method-select.component.html',
  styleUrl: './method-select.component.scss'
})
export class MethodSelectComponent {
  private elementRef = inject(ElementRef);

  method = model<RequestMethode>('GET');
  disabled = input<boolean>(false);
  buttonClass = input<string>('');
  dropdownClass = input<string>('');

  readonly methods = RequestMethodes;
  isOpen = signal<boolean>(false);
  focusedIndex = signal<number>(-1);

  getMethodClass(method: string | null | undefined): string {
    return getMethodSelectClass(method);
  }

  getMethodBadgeClass(method: string | null | undefined): string {
    return getMethodBadgeClass(method);
  }

  getMethodTextColorClass(method: string | null | undefined): string {
    return getMethodTextColorClass(method);
  }

  toggleDropdown() {
    if (this.disabled()) return;
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      const idx = this.methods.findIndex(m => m === this.method());
      this.focusedIndex.set(idx >= 0 ? idx : 0);
    }
  }

  closeDropdown() {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
  }

  selectMethod(method: RequestMethode) {
    if (this.disabled()) return;
    this.method.set(method);
    this.closeDropdown();
  }

  onKeydown(event: KeyboardEvent) {
    if (this.disabled()) return;

    if (!this.isOpen()) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.toggleDropdown();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.update(idx => (idx + 1) % this.methods.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update(idx => (idx - 1 + this.methods.length) % this.methods.length);
        break;
      case 'Home':
        event.preventDefault();
        this.focusedIndex.set(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusedIndex.set(this.methods.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedIndex() >= 0 && this.focusedIndex() < this.methods.length) {
          this.selectMethod(this.methods[this.focusedIndex()]);
        }
        break;
      case 'Tab':
        this.closeDropdown();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}
