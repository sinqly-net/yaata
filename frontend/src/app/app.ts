import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {initFlowbite} from 'flowbite';
import {WorkspaceSelection} from 'components/workspace-selection/workspace-selection';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorkspaceSelection],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly router = inject(Router);

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        initFlowbite();
      }
    });
  }
}
