import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestItem } from './request-item';
import { Request } from 'types/Request';
import { GlobalSelectionStore } from 'stores/global-selection-store';
import { CurrentRequestStore } from 'stores/current-request.store';
import { TreeContextMenuService } from 'services/tree-context-menu.service';
import { ComponentRef } from '@angular/core';

describe('RequestItem', () => {
  let component: RequestItem;
  let componentRef: ComponentRef<RequestItem>;
  let fixture: ComponentFixture<RequestItem>;
  let currentRequestStore: any;
  let contextMenuService: TreeContextMenuService;

  const mockRequest: Request = {
    id: 'req-1234',
    name: 'Get Users List',
    headers: [],
    query_params: [],
    url: 'https://api.example.com/users',
    body: {},
    method: 'GET',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestItem],
      providers: [
        {
          provide: GlobalSelectionStore,
          useValue: {},
        },
      ],
    }).compileComponents();

    currentRequestStore = TestBed.inject(CurrentRequestStore);
    contextMenuService = TestBed.inject(TreeContextMenuService);
    fixture = TestBed.createComponent(RequestItem);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('request', mockRequest);
    componentRef.setInput('margin_index', 0);
    fixture.detectChanges();
  });

  it('should render request name and method badge', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('GET');
    expect(compiled.textContent).toContain('Get Users List');
  });

  it('should call setRequest on CurrentRequestStore when clicked', () => {
    const spy = vi.spyOn(currentRequestStore, 'setRequest');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(spy).toHaveBeenCalledWith(mockRequest);
  });

  it('should call contextMenuService.openRequestMenu when right clicked', () => {
    const spy = vi.spyOn(contextMenuService, 'openRequestMenu');
    const mouseEvent = new MouseEvent('contextmenu');
    component.onContextMenu(mouseEvent);
    expect(spy).toHaveBeenCalledWith(mouseEvent, mockRequest);
  });
});
