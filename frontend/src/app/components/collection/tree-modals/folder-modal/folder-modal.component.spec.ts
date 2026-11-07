import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FolderModalComponent} from './folder-modal.component';
import {FolderService} from 'services/folder.service';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {of} from 'rxjs';
import {Folder} from 'types/Folder';
import {UUID} from 'types/UUID';

describe('FolderModalComponent', () => {
  let component: FolderModalComponent;
  let fixture: ComponentFixture<FolderModalComponent>;
  let folderService: FolderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    folderService = TestBed.inject(FolderService);
    fixture = TestBed.createComponent(FolderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be closed initially', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('should open in create mode and submit new folder', () => {
    const mockCreated: Folder = {
      id: 'f-new' as UUID,
      name: 'New Folder',
      folders: [],
      requests: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    vi.spyOn(folderService, 'createFolder').mockReturnValue(of(mockCreated));

    component.openCreate('col-1' as UUID);
    expect(component.isOpen()).toBe(true);
    expect(component.mode()).toBe('create');

    component.name.set('New Folder');

    let savedFolder: Folder | null = null;
    component.saved.subscribe((f) => (savedFolder = f));

    component.onSubmit();
    expect(folderService.createFolder).toHaveBeenCalledWith({
      name: 'New Folder',
      collection_id: 'col-1' as UUID,
    });
    expect(savedFolder).toBe(mockCreated);
    expect(component.isOpen()).toBe(false);
  });

  it('should open in rename mode and submit renamed folder', () => {
    const existing: Folder = {
      id: 'f-1' as UUID,
      name: 'Old Folder',
      folders: [],
      requests: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const mockUpdated: Folder = {
      ...existing,
      name: 'Renamed Folder'
    };

    vi.spyOn(folderService, 'updateFolder').mockReturnValue(of(mockUpdated));

    component.openRename(existing);
    expect(component.isOpen()).toBe(true);
    expect(component.mode()).toBe('rename');
    expect(component.name()).toBe('Old Folder');

    component.name.set('Renamed Folder');

    let savedFolder: Folder | null = null;
    component.saved.subscribe((f) => (savedFolder = f));

    component.onSubmit();
    expect(folderService.updateFolder).toHaveBeenCalledWith('f-1' as UUID, {
      name: 'Renamed Folder',
    });
    expect(savedFolder).toBe(mockUpdated);
    expect(component.isOpen()).toBe(false);
  });
});
