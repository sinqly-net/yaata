import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Tabs} from './tabs';
import {TabItem} from './tab-item/tab-item';

@Component({
  template: `
    <app-tabs [(selected)]="selectedTab">
      <app-tab-item key="body" [badge]="bodyBadge">Body</app-tab-item>
      <app-tab-item key="params" [badge]="paramsBadge">Parameters</app-tab-item>
      <app-tab-item key="headers">Headers</app-tab-item>
    </app-tabs>
  `,
  imports: [Tabs, TabItem],
})
class TestHostComponent {
  selectedTab = 'body';
  bodyBadge: string | number | null = '•';
  paramsBadge: string | number | null = 3;
}

describe('Tabs & TabItem Components', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render tabs and mark initial selected tab as active', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(3);

    expect(buttons[0].textContent).toContain('Body');
    expect(buttons[0].classList.contains('bg-slate-800')).toBe(true);
    expect(buttons[1].classList.contains('bg-slate-800')).toBe(false);
  });

  it('should render badges when provided', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].textContent).toContain('•');
    expect(buttons[1].textContent).toContain('3');
  });

  it('should switch selected tab on click', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    fixture.detectChanges();

    expect(host.selectedTab).toBe('params');
    expect(buttons[1].classList.contains('bg-slate-800')).toBe(true);
    expect(buttons[0].classList.contains('bg-slate-800')).toBe(false);
  });
});
