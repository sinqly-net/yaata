import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Collection } from './collection';
import { GlobalSelectionStore } from 'stores/global-selection-store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('Collection', () => {
  let component: Collection;
  let fixture: ComponentFixture<Collection>;

  const mockGlobalSelectionStore = {
    selectedCollection: signal({
      id: 'col-1',
      name: 'Test Collection',
      folders: [
        {
          id: 'f-1',
          name: 'Main Folder',
          folders: [],
          requests: [],
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      created_at: new Date(),
      updated_at: new Date()
    }),
    selectedWorkspace: signal({
      id: 'ws-access-1',
      workspace: {
        id: 'ws-1',
        name: 'Test Workspace',
        collections: []
      }
    }),
    selectCollection: () => ({ id: 'col-1' }),
    reloadWorkspaces: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Collection],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ collection_id: 'col-1' })
          }
        },
        {
          provide: GlobalSelectionStore,
          useValue: mockGlobalSelectionStore
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Collection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and have sidebar open by default', () => {
    expect(component).toBeTruthy();
    expect(component.isSidebarOpen()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ordner & Anfragen');
  });

  it('should toggle sidebar when toggleSidebar is called', () => {
    expect(component.isSidebarOpen()).toBe(true);
    component.toggleSidebar();
    fixture.detectChanges();
    expect(component.isSidebarOpen()).toBe(false);

    component.toggleSidebar();
    fixture.detectChanges();
    expect(component.isSidebarOpen()).toBe(true);
  });

  it('should open request modal when openNewRequestModal is called', () => {
    const modalSpy = vi.spyOn(component.requestModal()!, 'openCreate');
    component.openNewRequestModal();
    expect(modalSpy).toHaveBeenCalledWith('f-1', [{ id: 'f-1', name: 'Main Folder' }]);
  });

  it('should open folder modal when openNewFolderModal is called', () => {
    const modalSpy = vi.spyOn(component.folderModal()!, 'openCreate');
    component.openNewFolderModal();
    expect(modalSpy).toHaveBeenCalledWith('col-1', undefined);
  });
});
