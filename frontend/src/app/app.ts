import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {initFlowbite} from 'flowbite';
import {WorkspaceSelection} from 'components/workspace-selection/workspace-selection';
import {Workspace} from 'services/workspace';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorkspaceSelection],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly workspaceService = inject(Workspace);

  ngOnInit() {
    this.workspaceService.auth_test();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        initFlowbite();
      }
    });
  }
}
