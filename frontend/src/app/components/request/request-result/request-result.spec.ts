import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RequestResult} from './request-result';
import {CurrentRequestStore} from 'stores/current-request.store';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {RequestHistory} from 'types/RequestHistory';

describe('RequestResult', () => {
  let component: RequestResult;
  let fixture: ComponentFixture<RequestResult>;
  let requestStore: any;

  const mockResult: RequestHistory = {
    id: 'hist-1234',
    ok: true,
    status: 200,
    status_text: 'OK',
    headers: {
      'content-type': 'application/json',
    },
    body: {
      message: 'Hello World',
    },
    error: null,
    request_data: {
      id: 'req-1234',
      name: 'Get Greeting',
      url: 'https://api.example.com/greeting',
      method: 'GET',
    },
    duration_ms: 42,
    request_id: 'req-1234',
    created_at: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestResult],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    requestStore = TestBed.inject(CurrentRequestStore);
    fixture = TestBed.createComponent(RequestResult);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create RequestResult component', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('body');
  });

  it('should switch tabs', () => {
    component.selectTab('headers');
    expect(component.activeTab()).toBe('headers');

    component.selectTab('snapshot');
    expect(component.activeTab()).toBe('snapshot');

    component.selectTab('history');
    expect(component.activeTab()).toBe('history');
  });

  it('should render response body when result is present and detect JSON', () => {
    requestStore.setRequest({
      id: 'req-1234',
      name: 'Get Greeting',
      url: 'https://api.example.com/greeting',
      method: 'GET',
      headers: [],
      query_params: [],
      body: {},
      created_at: new Date(),
    });
    requestStore.selectHistoryItem(mockResult);
    fixture.detectChanges();

    expect(component.detectedType()).toBe('json');
    expect(component.formattedBody()).toContain('Hello World');
    expect(component.responseSizeFormatted()).not.toBe('0 B');
  });

  it('should auto-detect XML response', () => {
    const xmlResult: RequestHistory = {
      ...mockResult,
      headers: {'content-type': 'application/xml'},
      body: '<response><status>ok</status></response>'
    };
    requestStore.selectHistoryItem(xmlResult);
    fixture.detectChanges();

    expect(component.detectedType()).toBe('xml');
    expect(component.formattedBody()).toContain('<status>ok</status>');
  });

  it('should auto-detect HTML response', () => {
    const htmlResult: RequestHistory = {
      ...mockResult,
      headers: {'content-type': 'text/html'},
      body: '<!DOCTYPE html><html><body><h1>Title</h1></body></html>'
    };
    requestStore.selectHistoryItem(htmlResult);
    fixture.detectChanges();

    expect(component.detectedType()).toBe('html');
  });

  it('should auto-detect Image response', () => {
    const imageResult: RequestHistory = {
      ...mockResult,
      headers: {'content-type': 'image/png'},
      body: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };
    requestStore.selectHistoryItem(imageResult);
    fixture.detectChanges();

    expect(component.detectedType()).toBe('image');
    expect(component.imageSrc()).toContain('data:image/png;base64');
  });

  it('should provide correct responseLanguage and displayBody for pretty and raw modes', () => {
    requestStore.selectHistoryItem(mockResult);
    fixture.detectChanges();

    expect(component.responseLanguage()).toBe('json');
    expect(component.displayBody()).toContain('Hello World');

    component.setViewMode('raw');
    expect(component.responseLanguage()).toBe('plaintext');
    expect(component.displayBody()).toBe(JSON.stringify(mockResult.body));
  });

  it('should copy body to clipboard', async () => {
    requestStore.selectHistoryItem(mockResult);
    fixture.detectChanges();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    component.copyBody();

    expect(writeTextMock).toHaveBeenCalledWith(component.formattedBody());
  });
});
