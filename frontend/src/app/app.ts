import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {initFlowbite} from 'flowbite';
import {WorkspaceSelection} from 'components/workspace-selection/workspace-selection';
import {GlobalSelectionStore} from 'stores/global-selection-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorkspaceSelection],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly selectionStore = inject(GlobalSelectionStore);

  constructor() {
    this.selectionStore.init();
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        initFlowbite();
      }
    });
  }
}
