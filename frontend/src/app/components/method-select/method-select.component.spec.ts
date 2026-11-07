import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MethodSelectComponent} from './method-select.component';
import {RequestMethode} from 'types/Request';

describe('MethodSelectComponent', () => {
  let component: MethodSelectComponent;
  let fixture: ComponentFixture<MethodSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MethodSelectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MethodSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default GET method', () => {
    expect(component).toBeTruthy();
    expect(component.method()).toBe('GET');
    expect(component.isOpen()).toBe(false);
  });

  it('should toggle dropdown open and closed on trigger click', () => {
    const triggerBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(triggerBtn).toBeTruthy();

    triggerBtn.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    let dropdown = fixture.nativeElement.querySelector('[role="listbox"]');
    expect(dropdown).toBeTruthy();

    triggerBtn.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('should not toggle dropdown when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const triggerBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    triggerBtn.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('should select method on item click and close dropdown', () => {
    component.toggleDropdown();
    fixture.detectChanges();

    const options: HTMLElement[] = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options.length).toBe(component.methods.length);

    // Click on POST option
    const postOption = Array.from(options).find(opt => opt.textContent?.includes('POST'));
    expect(postOption).toBeTruthy();

    postOption!.click();
    fixture.detectChanges();

    expect(component.method()).toBe('POST');
    expect(component.isOpen()).toBe(false);
  });

  it('should navigate options with keyboard (ArrowDown, ArrowUp, Enter, Escape)', () => {
    // Open via Enter on trigger
    const container: HTMLElement = fixture.nativeElement.querySelector('div');
    container.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    // Navigate down
    container.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
    fixture.detectChanges();
    expect(component.focusedIndex()).toBe(1);

    // Select with Enter
    const expectedMethod = component.methods[1];
    container.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
    fixture.detectChanges();

    expect(component.method()).toBe(expectedMethod);
    expect(component.isOpen()).toBe(false);

    // Open and close with Escape
    container.dispatchEvent(new KeyboardEvent('keydown', {key: ' '}));
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    container.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('should close on document click outside', () => {
    component.toggleDropdown();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    document.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });
});
