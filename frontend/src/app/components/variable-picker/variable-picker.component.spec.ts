import {ComponentFixture, TestBed} from '@angular/core/testing';
import {VariablePickerComponent} from './variable-picker.component';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {Request} from 'types/Request';
import {of} from 'rxjs';
import {Requesting} from 'services/requesting';

describe('VariablePickerComponent', () => {
  let component: VariablePickerComponent;
  let fixture: ComponentFixture<VariablePickerComponent>;
  let requestingService: Requesting;

  const mockRequest: Request = {
    id: 'req-1',
    name: 'Get Access Token',
    method: 'POST',
    url: 'https://httpbin.org/post',
    body: {},
    query_params: [],
    headers: [],
    created_at: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariablePickerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GlobalSelectionStore,
        Requesting,
      ],
    }).compileComponents();

    requestingService = TestBed.inject(Requesting);
    fixture = TestBed.createComponent(VariablePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter requests based on search query', () => {
    component.requestSearch.set('token');
    expect(component.requestSearch()).toBe('token');
  });

  it('should load history and extract fields when request is chosen', () => {
    vi.spyOn(requestingService, 'getHistory').mockReturnValue(of([
      {
        id: 'hist-1',
        request_id: 'req-1',
        ok: true,
        status: 200,
        status_text: 'OK',
        created_at: new Date(),
        headers: {'content-type': 'application/json'},
        body: {token: 'sample-token', user_id: '123'},
      }
    ]));

    component.chooseRequest(mockRequest);
    expect(component.selectedRequest()).toEqual(mockRequest);
    expect(component.latestHistory()).toBeTruthy();
    expect(component.extractedFields().length).toBeGreaterThan(0);

    const tokenField = component.extractedFields().find(f => f.path === 'token');
    expect(tokenField?.valuePreview).toBe('sample-token');
  });

  it('should emit variable when confirmSelection is called', () => {
    let emitted: any = null;
    component.selected.subscribe(val => {
      emitted = val;
    });

    component.selectedRequest.set(mockRequest);
    component.selectedField.set('token');
    component.confirmSelection();

    expect(emitted).toEqual({
      raw: '${Get Access Token.token}',
      requestName: 'Get Access Token',
      fieldPath: 'token',
    });
  });
});
