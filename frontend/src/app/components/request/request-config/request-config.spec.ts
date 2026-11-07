import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RequestConfig} from './request-config';
import {CurrentRequestStore} from 'stores/current-request.store';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

describe('RequestConfig', () => {
  let component: RequestConfig;
  let fixture: ComponentFixture<RequestConfig>;
  let requestStore: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestConfig],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    requestStore = TestBed.inject(CurrentRequestStore);
    fixture = TestBed.createComponent(RequestConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component with default tab body', () => {
    expect(component).toBeTruthy();
    expect(component.selectedWorkingTab).toBe('body');
  });

  it('should calculate active parameters and headers count', () => {
    requestStore.query_params.set([
      {key: 'param1', value: 'v1', disabled: false},
      {key: 'param2', value: 'v2', disabled: true},
      {key: '', value: 'v3', disabled: false},
    ]);
    requestStore.headers.set([
      {key: 'Authorization', value: 'Bearer xyz', disabled: false},
      {key: 'Content-Type', value: 'application/json', disabled: false},
    ]);

    expect(component.activeParamsCount()).toBe(1);
    expect(component.activeHeadersCount()).toBe(2);
  });

  it('should calculate body parameters count for objects and arrays', () => {
    requestStore.body.set({name: 'Alice', age: 30, city: 'Berlin'});
    expect(component.bodyParamsCount()).toBe(3);

    requestStore.body.set([1, 2, 3, 4]);
    expect(component.bodyParamsCount()).toBe(4);

    requestStore.body.set('{"title": "Test", "completed": false}');
    expect(component.bodyParamsCount()).toBe(2);

    requestStore.body.set('["item1", "item2"]');
    expect(component.bodyParamsCount()).toBe(2);

    requestStore.body.set({});
    expect(component.bodyParamsCount()).toBe(0);

    requestStore.body.set([]);
    expect(component.bodyParamsCount()).toBe(0);

    requestStore.body.set('');
    expect(component.bodyParamsCount()).toBe(0);

    requestStore.body.set('invalid json');
    expect(component.bodyParamsCount()).toBe(0);

    requestStore.body.set(null);
    expect(component.bodyParamsCount()).toBe(0);
  });
});
