import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener, input,
  output,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

@Directive({
  selector: '[tooltip]',
  standalone: true,
})
export class TooltipDirective implements AfterViewInit {
  tooltip = input.required<string>();
  tooltipTemplate = input<TemplateRef<any>>();
  tooltipClass = input<string>();
  tooltipPlacement = input<| 'top'
    | 'bottom'
    | 'right'
    | 'left'>();
  tooltipShowArrow = input<boolean>(true);
  tooltipTrigger = input<'hover' | 'click'>('hover');

  tooltipSwitchEvent = output<boolean>();

  show = false;
  id = '';
  srcElement: HTMLElement | undefined;
  tooltipElement: HTMLElement | undefined;
  lastClasses = '';
  defaultClasses =
    'absolute z-10 invisible inline-block px-1.5 py-1.5 text-sm font-medium text-white transition-opacity duration-300 bg-gray-600 rounded shadow-sm opacity-0 tooltip dark:bg-gray-700';

  constructor(
    private element: ElementRef,
    private viewContainer: ViewContainerRef
  ) {
    this.id = this.generateID();
  }

  ngAfterViewInit(): void {
    const srcElement = this.element.nativeElement as HTMLElement;
    const parentElement = srcElement.parentElement!;
    this.srcElement = srcElement;
    const _tooltipPlacement = this.tooltipPlacement();
    const _tooltipTrigger = this.tooltipTrigger();

    srcElement.setAttribute('data-tooltip-target', this.id);
    if (_tooltipPlacement)
      srcElement.setAttribute('data-tooltip-placement', _tooltipPlacement);
    if (_tooltipTrigger)
      srcElement.setAttribute('data-tooltip-trigger', _tooltipTrigger);

    const _tooltipTemplate = this.tooltipTemplate();
    if (_tooltipTemplate) {
      const embeddedView = this.viewContainer.createEmbeddedView(
        _tooltipTemplate
      );
      embeddedView.rootNodes.at(0).id = this.id;
    } else {
      if (this.tooltip().length === 0) {
        srcElement.removeAttribute('data-tooltip-target');
        return;
      }

      const tooltipTemplateElement = document.createElement('div');
      const _tooltipClass = this.tooltipClass();
      const classes = `${_tooltipClass ? _tooltipClass : ''} ${this.defaultClasses}`;
      tooltipTemplateElement.innerHTML = `<div id="${this.id}" role="tooltip" ${_tooltipPlacement ? `data-popper-placement="'${_tooltipPlacement}'"` : ''} class="${classes}">
          <span id="${this.id}-text">${this.tooltip()}</span>
          ${this.tooltipShowArrow() ? '<div class="tooltip-arrow" data-popper-arrow></div>' : ''}
        </div>`;
      this.lastClasses = classes;
      this.tooltipElement = tooltipTemplateElement.children.item(
        0
      ) as HTMLElement;
      parentElement.appendChild(tooltipTemplateElement);
    }
  }

  @HostListener('mouseenter')
  showTooltip(): void {
    this.checkTooltipChanged();
    this.checkClassesChanged();
    this.show = true;
    this.tooltipSwitchEvent.emit(this.show);
  }

  @HostListener('mouseleave')
  hideTooltip(): void {
    this.checkTooltipChanged();
    this.checkClassesChanged();
    this.show = false;
    this.tooltipSwitchEvent.emit(this.show);
  }

  // when tooltip in DOM and directive not the same, override DOM
  checkTooltipChanged() {
    const tooltipSpanElement = document.getElementById(`${this.id}-text`);
    if (tooltipSpanElement) {
      const same = tooltipSpanElement?.textContent === this.tooltip();
      if (!same && this.tooltip().length > 0)
        tooltipSpanElement.textContent = this.tooltip();
      return;
    }
  }

  checkClassesChanged() {
    const _tooltipClass = this.tooltipClass();
    this.tooltipElement!.className = `${_tooltipClass ? _tooltipClass : ''} ${this.defaultClasses}`;
  }

  generateID(): string {
    const generatedID = (Math.random() + 1).toString(36).substring(7);
    const exists = document.getElementById(generatedID);
    if (exists) return this.generateID();
    return generatedID;
  }
}
