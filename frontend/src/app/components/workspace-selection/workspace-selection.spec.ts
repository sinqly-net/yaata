import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkspaceSelection } from './workspace-selection';
import { GlobalSelectionStore } from 'stores/global-selection-store';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WorkspaceSelection', () => {
  let component: WorkspaceSelection;
  let fixture: ComponentFixture<WorkspaceSelection>;

  const mockGlobalStore = {
    permittedWorkspaces: signal([
      {
        id: 'access-1',
        permissions: 'write',
        workspace: {
          id: 'ws-1',
          name: 'Default Workspace',
          created_at: new Date(),
          updated_at: new Date()
        }
      }
    ]),
    selectedWorkspace: signal({
      id: 'access-1',
      permissions: 'write',
      workspace: {
        id: 'ws-1',
        name: 'Default Workspace',
        created_at: new Date(),
        updated_at: new Date()
      }
    }),
    selectWorkspace: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceSelection],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GlobalSelectionStore, useValue: mockGlobalStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceSelection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create WorkspaceSelection', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate openCreate to modal', () => {
    const modal = component.modal();
    expect(modal).toBeTruthy();
    const openCreateSpy = vi.spyOn(modal!, 'openCreate');

    component.openCreate();
    expect(openCreateSpy).toHaveBeenCalled();
  });

  it('should delegate openEdit to modal', () => {
    const modal = component.modal();
    expect(modal).toBeTruthy();
    const openEditSpy = vi.spyOn(modal!, 'openEdit');

    const testWs = {
      id: 'ws-1',
      name: 'Default Workspace',
      collections: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    component.openEdit(testWs);
    expect(openEditSpy).toHaveBeenCalledWith(testWs);
  });
});
