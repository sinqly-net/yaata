import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RequestModalComponent} from './request-modal.component';
import {RequestService} from 'services/request.service';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {of} from 'rxjs';
import {Request} from 'types/Request';
import {UUID} from 'types/UUID';

describe('RequestModalComponent', () => {
  let component: RequestModalComponent;
  let fixture: ComponentFixture<RequestModalComponent>;
  let requestService: RequestService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    requestService = TestBed.inject(RequestService);
    fixture = TestBed.createComponent(RequestModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be closed initially', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('should open in create mode and submit new request', () => {
    const mockCreated: Request = {
      id: 'r-new' as UUID,
      name: 'New Test Request',
      url: 'https://api.test.com',
      method: 'GET',
      headers: [],
      query_params: [],
      body: {},
      created_at: new Date(),
      updated_at: new Date()
    };

    vi.spyOn(requestService, 'createRequest').mockReturnValue(of(mockCreated));

    component.openCreate('f-1' as UUID, [{ id: 'f-1' as UUID, name: 'Folder 1' }]);
    expect(component.isOpen()).toBe(true);
    expect(component.mode()).toBe('create');

    component.name.set('New Test Request');
    component.url.set('https://api.test.com');

    let savedRequest: Request | null = null;
    component.saved.subscribe((r) => (savedRequest = r));

    component.onSubmit();
    expect(requestService.createRequest).toHaveBeenCalledWith({
      name: 'New Test Request',
      folder_id: 'f-1' as UUID,
      method: 'GET',
      url: 'https://api.test.com',
    });
    expect(savedRequest).toBe(mockCreated);
    expect(component.isOpen()).toBe(false);
  });

  it('should open in rename mode and submit rename', () => {
    const existing: Request = {
      id: 'r-1' as UUID,
      name: 'Old Name',
      url: 'https://api.test.com',
      method: 'POST',
      headers: [],
      query_params: [],
      body: {},
      created_at: new Date(),
      updated_at: new Date()
    };

    const mockUpdated: Request = {
      ...existing,
      name: 'Renamed Request'
    };

    vi.spyOn(requestService, 'updateRequest').mockReturnValue(of(mockUpdated));

    component.openRename(existing);
    expect(component.isOpen()).toBe(true);
    expect(component.mode()).toBe('rename');
    expect(component.name()).toBe('Old Name');

    component.name.set('Renamed Request');

    let savedRequest: Request | null = null;
    component.saved.subscribe((r) => (savedRequest = r));

    component.onSubmit();
    expect(requestService.updateRequest).toHaveBeenCalledWith('r-1' as UUID, {
      name: 'Renamed Request',
    });
    expect(savedRequest).toBe(mockUpdated);
    expect(component.isOpen()).toBe(false);
  });
});
