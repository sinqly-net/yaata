import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkspaceModal } from './workspace-modal.component';
import { WorkspaceService } from 'services/workspace';
import { GlobalSelectionStore } from 'stores/global-selection-store';
import { of, throwError } from 'rxjs';
import { Workspace } from 'types/Workspace';
import { WorkspaceAccess } from 'types/WorkspaceAccess';

describe('WorkspaceModal', () => {
  let component: WorkspaceModal;
  let fixture: ComponentFixture<WorkspaceModal>;
  let mockWorkspaceService: any;
  let mockGlobalStore: any;

  beforeEach(async () => {
    mockWorkspaceService = {
      createWorkspace: vi.fn(),
      updateWorkspace: vi.fn()
    };
    mockGlobalStore = {
      addWorkspace: vi.fn(),
      updateWorkspace: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [WorkspaceModal],
      providers: [
        { provide: WorkspaceService, useValue: mockWorkspaceService },
        { provide: GlobalSelectionStore, useValue: mockGlobalStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and be closed by default', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it('should open in create mode', () => {
    component.openCreate();
    expect(component.isOpen()).toBe(true);
    expect(component.mode()).toBe('create');
    expect(component.nameInput()).toBe('');
  });

  it('should open in edit mode with workspace data', () => {
    const testWs: Workspace = {
      id: 'ws-1',
      name: 'Existing Workspace',
      collections: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    component.openEdit(testWs);
    expect(component.isOpen()).toBe(true);
    expect(component.mode()).toBe('edit');
    expect(component.workspaceId()).toBe('ws-1');
    expect(component.nameInput()).toBe('Existing Workspace');
  });

  it('should create workspace successfully', () => {
    const mockAccess: WorkspaceAccess = {
      id: 'access-1',
      permissions: 'write',
      created_at: new Date(),
      updated_at: new Date(),
      workspace: {
        id: 'new-ws',
        name: 'New Workspace',
        collections: [],
        created_at: new Date(),
        updated_at: new Date()
      }
    };

    mockWorkspaceService.createWorkspace.mockReturnValue(of(mockAccess));

    component.openCreate();
    component.nameInput.set('New Workspace');
    component.save();

    expect(mockWorkspaceService.createWorkspace).toHaveBeenCalledWith('New Workspace');
    expect(mockGlobalStore.addWorkspace).toHaveBeenCalledWith(mockAccess);
    expect(component.isOpen()).toBe(false);
  });

  it('should update workspace successfully', () => {
    const testWs: Workspace = {
      id: 'ws-1',
      name: 'Old Name',
      collections: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const updatedWs: Workspace = {
      ...testWs,
      name: 'Updated Name'
    };

    mockWorkspaceService.updateWorkspace.mockReturnValue(of(updatedWs));

    component.openEdit(testWs);
    component.nameInput.set('Updated Name');
    component.save();

    expect(mockWorkspaceService.updateWorkspace).toHaveBeenCalledWith('ws-1', 'Updated Name');
    expect(mockGlobalStore.updateWorkspace).toHaveBeenCalledWith(updatedWs);
    expect(component.isOpen()).toBe(false);
  });

  it('should display error message on empty name', () => {
    component.openCreate();
    component.nameInput.set('   ');
    component.save();

    expect(component.errorMessage()).toContain('Bitte gib einen Namen');
    expect(mockWorkspaceService.createWorkspace).not.toHaveBeenCalled();
  });
});
