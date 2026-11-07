import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FolderTree } from './folder-tree';
import { Folder } from 'types/Folder';
import { GlobalSelectionStore } from 'stores/global-selection-store';
import { TreeContextMenuService } from 'services/tree-context-menu.service';
import { ComponentRef } from '@angular/core';

describe('FolderTree', () => {
  let component: FolderTree;
  let componentRef: ComponentRef<FolderTree>;
  let fixture: ComponentFixture<FolderTree>;

  const mockFolder: Folder = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Test Folder',
    folders: [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Child Folder',
        folders: [],
        requests: [],
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    requests: [
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Test Request',
        headers: [],
        query_params: [],
        url: 'http://localhost/test',
        body: {},
        method: 'GET',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderTree],
      providers: [
        {
          provide: GlobalSelectionStore,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderTree);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('folder', mockFolder);
    componentRef.setInput('margin_index', 0);
    fixture.detectChanges();
  });

  it('should create and be open by default', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Folder');
    expect(compiled.textContent).toContain('Test Request');
    expect(compiled.textContent).toContain('Child Folder');
  });

  it('should toggle collapse and expand when toggle is called or header is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.cursor-pointer') as HTMLElement;
    expect(header).toBeTruthy();

    header.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(compiled.textContent).toContain('Test Folder');
    expect(compiled.textContent).not.toContain('Test Request');
    expect(compiled.textContent).not.toContain('Child Folder');

    header.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(compiled.textContent).toContain('Test Request');
    expect(compiled.textContent).toContain('Child Folder');
  });

  it('should call contextMenuService.openFolderMenu when right clicked', () => {
    const contextMenuService = TestBed.inject(TreeContextMenuService);
    const spy = vi.spyOn(contextMenuService, 'openFolderMenu');

    const mouseEvent = new MouseEvent('contextmenu');
    component.onContextMenu(mouseEvent);

    expect(spy).toHaveBeenCalledWith(mouseEvent, mockFolder);
  });
});
