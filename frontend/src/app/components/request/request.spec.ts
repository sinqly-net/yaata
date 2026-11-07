import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Request} from './request';
import {CurrentRequestStore} from 'stores/current-request.store';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {vi} from 'vitest';

describe('Request Component', () => {
  let component: Request;
  let fixture: ComponentFixture<Request>;
  let requestStore: any;
  let storeMap: Record<string, string> = {};

  beforeEach(async () => {
    storeMap = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => storeMap[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storeMap[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storeMap[key];
      }),
      clear: vi.fn(() => {
        storeMap = {};
      }),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [Request],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    requestStore = TestBed.inject(CurrentRequestStore);
    fixture = TestBed.createComponent(Request);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create Request component', () => {
    expect(component).toBeTruthy();
    expect(component.splitPercent()).toBe(50);
  });

  it('should trigger sendRequest on Ctrl+Enter keyboard event', () => {
    const sendSpy = vi.spyOn(requestStore, 'sendRequest').mockImplementation(() => {});

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger sendRequest on Cmd+Enter (metaKey) keyboard event', () => {
    const sendSpy = vi.spyOn(requestStore, 'sendRequest').mockImplementation(() => {});

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('should not trigger sendRequest on plain Enter without Ctrl/Cmd', () => {
    const sendSpy = vi.spyOn(requestStore, 'sendRequest').mockImplementation(() => {});

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: false,
      metaKey: false,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('should update split percentage on dragging with mouse', () => {
    const container = component.splitContainer()?.nativeElement;
    if (container) {
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        height: 500,
        bottom: 600,
        left: 0,
        right: 800,
        width: 800,
        x: 0,
        y: 100,
        toJSON: () => {},
      });
    }

    const mouseEvent = new MouseEvent('mousedown');
    component.startDragging(mouseEvent);
    expect(component.isDragging()).toBe(true);

    const moveEvent = new MouseEvent('mousemove', {clientY: 250});
    window.dispatchEvent(moveEvent);

    // offsetY = 250 - 100 = 150. (150 / 500) * 100 = 30%
    expect(component.splitPercent()).toBe(30);

    const upEvent = new MouseEvent('mouseup');
    window.dispatchEvent(upEvent);
    expect(component.isDragging()).toBe(false);
    expect(localStorage.getItem('yaata_request_split_percent')).toBe('30');
  });

  it('should clamp split percentage within 15% and 85%', () => {
    const container = component.splitContainer()?.nativeElement;
    if (container) {
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        height: 500,
        bottom: 600,
        left: 0,
        right: 800,
        width: 800,
        x: 0,
        y: 100,
        toJSON: () => {},
      });
    }

    component.startDragging(new MouseEvent('mousedown'));

    // Move above top -> clamp to 15%
    window.dispatchEvent(new MouseEvent('mousemove', {clientY: 110}));
    expect(component.splitPercent()).toBe(15);

    // Move below bottom -> clamp to 85%
    window.dispatchEvent(new MouseEvent('mousemove', {clientY: 590}));
    expect(component.splitPercent()).toBe(85);

    window.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('should reset split to 50% on resetSplit', () => {
    component.splitPercent.set(30);
    component.resetSplit();
    expect(component.splitPercent()).toBe(50);
    expect(localStorage.getItem('yaata_request_split_percent')).toBe('50');
  });

  it('should adjust split with keyboard arrows and Home/End keys', () => {
    component.splitPercent.set(50);

    component.handleSplitterKey(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
    expect(component.splitPercent()).toBe(45);

    component.handleSplitterKey(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
    expect(component.splitPercent()).toBe(50);

    component.handleSplitterKey(new KeyboardEvent('keydown', {key: 'Home'}));
    expect(component.splitPercent()).toBe(15);

    component.handleSplitterKey(new KeyboardEvent('keydown', {key: 'End'}));
    expect(component.splitPercent()).toBe(85);
  });
});
