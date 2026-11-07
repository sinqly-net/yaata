import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ConfirmModalComponent} from './confirm-modal.component';
import {FolderService} from 'services/folder.service';
import {RequestService} from 'services/request.service';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {of} from 'rxjs';
import {Folder} from 'types/Folder';
import {Request} from 'types/Request';
import {UUID} from 'types/UUID';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;
  let folderService: FolderService;
  let requestService: RequestService;

  const mockFolder: Folder = {
    id: 'f-1' as UUID,
    name: 'Folder To Delete',
    folders: [],
    requests: [],
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockRequest: Request = {
    id: 'r-1' as UUID,
    name: 'Request To Delete',
    url: 'https://api.test.com',
    method: 'DELETE',
    headers: [],
    query_params: [],
    body: {},
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    folderService = TestBed.inject(FolderService);
    requestService = TestBed.inject(RequestService);
    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be closed initially', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('should handle delete folder confirmation', () => {
    vi.spyOn(folderService, 'deleteFolder').mockReturnValue(of({ message: 'Deleted', id: 'f-1' as UUID }));

    component.openDeleteFolder(mockFolder);
    expect(component.isOpen()).toBe(true);
    expect(component.action()).toBe('delete_folder');
    expect(component.isDanger()).toBe(true);

    let confirmedResult: any = null;
    component.confirmed.subscribe((res) => (confirmedResult = res));

    component.onConfirm();
    expect(folderService.deleteFolder).toHaveBeenCalledWith('f-1' as UUID);
    expect(confirmedResult).toEqual({ action: 'delete_folder', id: 'f-1' as UUID });
    expect(component.isOpen()).toBe(false);
  });

  it('should handle dissolve folder confirmation', () => {
    vi.spyOn(folderService, 'dissolveFolder').mockReturnValue(of({ message: 'Dissolved', id: 'f-1' as UUID }));

    component.openDissolveFolder(mockFolder);
    expect(component.isOpen()).toBe(true);
    expect(component.action()).toBe('dissolve_folder');
    expect(component.isDanger()).toBe(false);

    let confirmedResult: any = null;
    component.confirmed.subscribe((res) => (confirmedResult = res));

    component.onConfirm();
    expect(folderService.dissolveFolder).toHaveBeenCalledWith('f-1' as UUID);
    expect(confirmedResult).toEqual({ action: 'dissolve_folder', id: 'f-1' as UUID });
    expect(component.isOpen()).toBe(false);
  });

  it('should handle delete request confirmation', () => {
    vi.spyOn(requestService, 'deleteRequest').mockReturnValue(of({ message: 'Deleted', id: 'r-1' as UUID }));

    component.openDeleteRequest(mockRequest);
    expect(component.isOpen()).toBe(true);
    expect(component.action()).toBe('delete_request');
    expect(component.isDanger()).toBe(true);

    let confirmedResult: any = null;
    component.confirmed.subscribe((res) => (confirmedResult = res));

    component.onConfirm();
    expect(requestService.deleteRequest).toHaveBeenCalledWith('r-1' as UUID);
    expect(confirmedResult).toEqual({ action: 'delete_request', id: 'r-1' as UUID });
    expect(component.isOpen()).toBe(false);
  });
});
