import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TreeContextMenuComponent} from './tree-context-menu.component';
import {Folder} from 'types/Folder';
import {Request} from 'types/Request';
import {UUID} from 'types/UUID';

describe('TreeContextMenuComponent', () => {
  let component: TreeContextMenuComponent;
  let fixture: ComponentFixture<TreeContextMenuComponent>;

  const mockFolder: Folder = {
    id: 'f-1' as UUID,
    name: 'Auth Folder',
    folders: [],
    requests: [],
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockRequest: Request = {
    id: 'r-1' as UUID,
    name: 'Login Request',
    url: 'https://api.example.com/login',
    method: 'POST',
    headers: [],
    query_params: [],
    body: {},
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeContextMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TreeContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be closed initially', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('should open for folder and emit actions', () => {
    const mouseEvent = new MouseEvent('contextmenu', { clientX: 100, clientY: 150 });
    component.openForFolder(mouseEvent, mockFolder);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(component.targetType()).toBe('folder');
    expect(component.targetFolder()).toBe(mockFolder);

    let emittedFolder: Folder | null = null;
    component.createRequestInFolder.subscribe((f) => (emittedFolder = f));

    component.triggerCreateRequest();
    expect(emittedFolder).toBe(mockFolder);
    expect(component.isOpen()).toBe(false);
  });

  it('should open for request and emit actions', () => {
    const mouseEvent = new MouseEvent('contextmenu', { clientX: 200, clientY: 250 });
    component.openForRequest(mouseEvent, mockRequest);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(component.targetType()).toBe('request');
    expect(component.targetRequest()).toBe(mockRequest);

    let duplicateReq: Request | null = null;
    component.duplicateRequestAction.subscribe((r) => (duplicateReq = r));

    component.triggerDuplicateRequest();
    expect(duplicateReq).toBe(mockRequest);
    expect(component.isOpen()).toBe(false);
  });

  it('should close on Escape', () => {
    const mouseEvent = new MouseEvent('contextmenu', { clientX: 50, clientY: 50 });
    component.openForFolder(mouseEvent, mockFolder);
    expect(component.isOpen()).toBe(true);

    component.onEscape();
    expect(component.isOpen()).toBe(false);
  });
});
