import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="unauth">
      <div class="unauth__icon">
        <mat-icon>lock</mat-icon>
      </div>
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
      <a mat-flat-button color="primary" routerLink="/dashboard">
        <mat-icon>home</mat-icon> Go to Dashboard
      </a>
    </div>
  `,
  styles: [`
    .unauth {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      gap: 16px;
    }
    .unauth__icon {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(239,68,68,0.1);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 40px; color: var(--danger); }
    }
    h1 { margin: 0; font-size: 28px; }
    p { margin: 0; color: var(--text-secondary); }
  `]
})
export class UnauthorizedComponent {}
