import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WorkspaceShareModal} from './workspace-share-modal.component';
import {WorkspaceService} from 'services/workspace';
import {GlobalSelectionStore} from 'stores/global-selection-store';
import {of, throwError} from 'rxjs';
import {Workspace} from 'types/Workspace';
import {WorkspaceMember} from 'types/WorkspaceAccess';

describe('WorkspaceShareModal', () => {
  let component: WorkspaceShareModal;
  let fixture: ComponentFixture<WorkspaceShareModal>;
  let workspaceServiceMock: any;
  let globalSelectionStoreMock: any;

  const mockWorkspace: Workspace = {
    id: 'ws-123',
    name: 'Test Workspace',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'user-owner',
    collections: []
  };

  const mockMembers: WorkspaceMember[] = [
    {
      id: 'access-1',
      permissions: 'write',
      created_at: new Date(),
      updated_at: new Date(),
      user: {
        id: 'user-colleague',
        email: 'colleague@example.com',
        name: 'Colleague',
        created_at: new Date(),
        updated_at: new Date()
      }
    }
  ];

  beforeEach(async () => {
    workspaceServiceMock = {
      getWorkspaceAccess: vi.fn().mockReturnValue(of(mockMembers)),
      shareWorkspace: vi.fn().mockReturnValue(of(mockMembers[0])),
      revokeWorkspaceAccess: vi.fn().mockReturnValue(of({message: 'Access revoked successfully'}))
    };

    globalSelectionStoreMock = {
      selectedWorkspace: vi.fn().mockReturnValue({workspace: mockWorkspace, permissions: 'write'})
    };

    await TestBed.configureTestingModule({
      imports: [WorkspaceShareModal],
      providers: [
        {provide: WorkspaceService, useValue: workspaceServiceMock},
        {provide: GlobalSelectionStore, useValue: globalSelectionStoreMock}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceShareModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it('should open modal and load workspace access list', () => {
    component.open(mockWorkspace);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(component.targetWorkspace()?.id).toBe('ws-123');
    expect(workspaceServiceMock.getWorkspaceAccess).toHaveBeenCalledWith('ws-123');
    expect(component.accessList().length).toBe(1);
    expect(component.accessList()[0].user?.email).toBe('colleague@example.com');
  });

  it('should share workspace and refresh list', () => {
    component.open(mockWorkspace);
    fixture.detectChanges();

    component.emailInput.set('newmember@example.com');
    component.selectedPermission.set('admin');

    component.shareWorkspace();

    expect(workspaceServiceMock.shareWorkspace).toHaveBeenCalledWith('ws-123', 'newmember@example.com', 'admin');
    expect(component.emailInput()).toBe('');
    expect(component.successMessage()).toContain('newmember@example.com');
  });

  it('should handle share error', () => {
    workspaceServiceMock.shareWorkspace.mockReturnValue(throwError(() => ({error: {detail: 'User not found'}})));

    component.open(mockWorkspace);
    fixture.detectChanges();

    component.emailInput.set('unknown@example.com');
    component.shareWorkspace();

    expect(component.errorMessage()).toBe('User not found');
  });

  it('should revoke access and refresh list', () => {
    component.open(mockWorkspace);
    fixture.detectChanges();

    component.revokeAccess('user-colleague');

    expect(workspaceServiceMock.revokeWorkspaceAccess).toHaveBeenCalledWith('ws-123', 'user-colleague');
    expect(workspaceServiceMock.getWorkspaceAccess).toHaveBeenCalledTimes(2);
  });

  it('should close modal', () => {
    component.open(mockWorkspace);
    expect(component.isOpen()).toBe(true);

    component.close();
    expect(component.isOpen()).toBe(false);
  });
});
