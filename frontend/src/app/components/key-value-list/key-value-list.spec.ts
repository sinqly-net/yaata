import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KeyValueList } from './key-value-list';
import { IKeyValue } from 'types/KeyValue';

describe('KeyValueList', () => {
  let component: KeyValueList<IKeyValue>;
  let fixture: ComponentFixture<KeyValueList<IKeyValue>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyValueList],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyValueList<IKeyValue>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty list by default', () => {
    expect(component.list()).toEqual([]);
    expect(component.totalCount()).toBe(0);
    expect(component.activeCount()).toBe(0);
  });

  it('should add a new item with disabled: false', () => {
    component.addItem();
    expect(component.list().length).toBe(1);
    expect(component.list()[0]).toEqual({ key: '', value: '', disabled: false });
    expect(component.totalCount()).toBe(1);
    expect(component.activeCount()).toBe(1);
  });

  it('should update item key and value', () => {
    component.addItem();
    component.updateItem(0, { key: 'Authorization', value: 'Bearer token123' });
    expect(component.list()[0].key).toBe('Authorization');
    expect(component.list()[0].value).toBe('Bearer token123');
  });

  it('should toggle disabled state and reflect in activeCount', () => {
    component.addItem();
    component.addItem();
    expect(component.totalCount()).toBe(2);
    expect(component.activeCount()).toBe(2);

    // Disable first item
    component.updateItem(0, { disabled: true });
    expect(component.list()[0].disabled).toBe(true);
    expect(component.activeCount()).toBe(1);

    // Re-enable first item
    component.updateItem(0, { disabled: false });
    expect(component.list()[0].disabled).toBe(false);
    expect(component.activeCount()).toBe(2);
  });

  it('should remove an item by index', () => {
    component.addItem();
    component.addItem();
    component.updateItem(0, { key: 'item-0', value: 'val-0' });
    component.updateItem(1, { key: 'item-1', value: 'val-1' });

    component.removeItem(0);
    expect(component.list().length).toBe(1);
    expect(component.list()[0].key).toBe('item-1');
  });

  it('should clear all items', () => {
    component.addItem();
    component.addItem();
    expect(component.totalCount()).toBe(2);

    component.clearAll();
    expect(component.totalCount()).toBe(0);
    expect(component.list()).toEqual([]);
  });
});
