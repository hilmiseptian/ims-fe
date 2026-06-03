// src/app/features/pages/dynamic-page/dynamic-page.component.ts

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="dynamic-page">
      <div class="dynamic-page__icon">
        <mat-icon>rocket_launch</mat-icon>
      </div>
      <h1>{{ title() }}</h1>
      <p>This module is registered but not yet implemented.</p>
      <p class="sub">
        Route: <code>/{{ route() }}</code>
      </p>
      <a mat-flat-button color="primary" routerLink="/dashboard">
        <mat-icon>home</mat-icon> Back to Dashboard
      </a>
    </div>
  `,
  styles: [
    `
      .dynamic-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        gap: 16px;
      }
      .dynamic-page__icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--accent-light);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .dynamic-page__icon mat-icon {
        font-size: 40px;
        color: var(--accent);
      }
      h1 {
        margin: 0;
        font-size: 24px;
      }
      p {
        margin: 0;
        color: var(--text-secondary);
      }
      code {
        background: var(--surface-variant);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 13px;
      }
    `,
  ],
})
export class DynamicPageComponent {
  private activatedRoute = inject(ActivatedRoute);

  route = signal(this.activatedRoute.snapshot.params['pageRoute'] || '');
  title = signal(
    this.route()
      .split('-')
      .map((w: string) => {
        console.log('w:', w);
        console.log('type:', typeof w);

        return w[0].toUpperCase() + w.slice(1);
      })
      .join(' '),
  );
}
