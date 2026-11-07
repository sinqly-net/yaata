import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RequestConfigUrl} from './request-config-url.component';
import {CurrentRequestStore} from 'stores/current-request.store';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {vi} from 'vitest';

describe('RequestConfigUrl Component', () => {
  let component: RequestConfigUrl;
  let fixture: ComponentFixture<RequestConfigUrl>;
  let requestStore: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestConfigUrl],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    requestStore = TestBed.inject(CurrentRequestStore);
    fixture = TestBed.createComponent(RequestConfigUrl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create RequestConfigUrl component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle variable helper popover on help button click', () => {
    expect(component.showVariableHelper()).toBe(false);

    const helpBtn = fixture.nativeElement.querySelector('button[title="Hilfe zur dynamischen Parameter-Syntax"]');
    expect(helpBtn).toBeTruthy();

    helpBtn.click();
    fixture.detectChanges();

    expect(component.showVariableHelper()).toBe(true);
    const popover = fixture.nativeElement.querySelector('.animate-fadeIn');
    expect(popover).toBeTruthy();

    helpBtn.click();
    fixture.detectChanges();

    expect(component.showVariableHelper()).toBe(false);
  });

  it('should change HTTP method when onMethodChange is called', () => {
    const setMethodSpy = vi.spyOn(requestStore, 'setMethod');
    component.onMethodChange('POST');
    expect(setMethodSpy).toHaveBeenCalledWith('POST');
  });

  it('should call sendRequest on Send button click', () => {
    const sendSpy = vi.spyOn(requestStore, 'sendRequest').mockImplementation(() => {});
    const sendBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[title*="Anfrage senden"]');
    expect(sendBtn).toBeTruthy();

    sendBtn.click();
    fixture.detectChanges();

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});
