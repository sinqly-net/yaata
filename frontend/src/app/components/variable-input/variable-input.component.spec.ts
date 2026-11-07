import {ComponentFixture, TestBed} from '@angular/core/testing';
import {VariableInputComponent} from './variable-input.component';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {GlobalSelectionStore} from 'stores/global-selection-store';

describe('VariableInputComponent', () => {
  let component: VariableInputComponent;
  let fixture: ComponentFixture<VariableInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariableInputComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GlobalSelectionStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VariableInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse value into segments', () => {
    fixture.componentRef.setInput('value', 'Bearer ${Get Access Token.token} test');
    fixture.detectChanges();

    const segments = component.segments();
    expect(segments.length).toBe(3);
    expect(segments[0]).toEqual({ type: 'text', value: 'Bearer ' });
    expect(segments[1]).toEqual({
      type: 'variable',
      raw: '${Get Access Token.token}',
      requestName: 'Get Access Token',
      fieldPath: 'token',
    });
    expect(segments[2]).toEqual({ type: 'text', value: ' test' });
  });

  it('should remove variable and update value', () => {
    fixture.componentRef.setInput('value', 'Bearer ${Get Access Token.token}');
    fixture.detectChanges();

    component.removeVariable(1);
    expect(component.value()).toBe('Bearer ');
  });

  it('should toggle raw mode', () => {
    expect(component.isRawMode()).toBe(false);
    component.toggleRawMode();
    expect(component.isRawMode()).toBe(true);
  });

  it('should open edit modal on clicking variable chip', () => {
    fixture.componentRef.setInput('value', 'Bearer ${Get Access Token.token}');
    fixture.detectChanges();

    const varChip = fixture.nativeElement.querySelector('.inline-flex.items-center.gap-1');
    expect(varChip).toBeTruthy();
    expect(varChip.textContent).not.toContain('VAR');
    expect(varChip.textContent).toContain('Get Access Token');
    expect(varChip.textContent).toContain('token');

    varChip.click();
    fixture.detectChanges();

    expect(component.isPickerOpen()).toBe(true);
    expect(component.editingRequestName()).toBe('Get Access Token');
    expect(component.editingFieldPath()).toBe('token');
  });

  it('should remove variable when delete button clicked without opening edit modal', () => {
    fixture.componentRef.setInput('value', 'Bearer ${Get Access Token.token}');
    fixture.detectChanges();

    const deleteBtn = fixture.nativeElement.querySelector('button[title="Variable entfernen"]');
    expect(deleteBtn).toBeTruthy();

    deleteBtn.click();
    fixture.detectChanges();

    expect(component.value()).toBe('Bearer ');
    expect(component.isPickerOpen()).toBe(false);
  });
});
