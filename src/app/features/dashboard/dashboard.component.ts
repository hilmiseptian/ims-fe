import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface Stats {
  users: number;
  levels: number;
  pages: number;
  permissions: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Dashboard</h1>
        <p class="page-header__subtitle">Welcome back, {{ user()?.full_name }}</p>
      </div>
    </div>

    <div class="stat-grid">
      @for (card of statCards; track card.label) {
        <div class="stat-card" [style.--accent-color]="card.color">
          <div class="stat-card__icon">
            <mat-icon>{{ card.icon }}</mat-icon>
          </div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ stats()[card.key] ?? '—' }}</div>
            <div class="stat-card__label">{{ card.label }}</div>
          </div>
          <a class="stat-card__link" [routerLink]="card.route">
            <mat-icon>arrow_forward</mat-icon>
          </a>
        </div>
      }
    </div>

    <div class="info-grid">
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>Your Permissions</mat-card-title>
          <mat-card-subtitle>{{ permissions().length }} permissions active</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="perm-chips">
            @for (perm of permissions(); track perm) {
              <span class="perm-chip">{{ perm }}</span>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>Account Info</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-label">Full Name</span>
              <span>{{ user()?.full_name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Username</span>
              <span>{{ user()?.username }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span>{{ user()?.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Level</span>
              <span class="status-chip active">{{ user()?.level_name }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: var(--shadow-md); }

      &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 4px;
        background: var(--accent-color);
      }
    }

    .stat-card__icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--accent-color) 12%, transparent);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { color: var(--accent-color); font-size: 24px; }
    }

    .stat-card__body { flex: 1; min-width: 0; }
    .stat-card__value { font-size: 28px; font-weight: 700; line-height: 1; }
    .stat-card__label { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

    .stat-card__link {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px;
      background: var(--surface-variant);
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.15s;
      &:hover {
        background: var(--accent-color);
        color: white;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }

    .info-card { padding: 4px; }

    .perm-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding-top: 12px;
    }

    .perm-chip {
      background: var(--accent-light);
      color: var(--accent);
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 12px;
      font-family: 'DM Mono', monospace;
      font-weight: 500;
    }

    .info-rows { padding-top: 12px; display: flex; flex-direction: column; gap: 12px; }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; padding-bottom: 0; }
    }
    .info-label { font-size: 13px; color: var(--text-secondary); }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  user = this.auth.currentUser;
  permissions = this.auth.permissions;
  stats = signal<Partial<Record<string, number>>>({});

  statCards = [
    { key: 'users',       label: 'Total Users',       icon: 'people',                 route: '/users',       color: '#4f46e5' },
    { key: 'levels',      label: 'Total Levels',      icon: 'layers',                 route: '/levels',      color: '#0891b2' },
    { key: 'pages',       label: 'Total Pages',       icon: 'article',                route: '/pages',       color: '#059669' },
    { key: 'permissions', label: 'Total Permissions', icon: 'admin_panel_settings',   route: '/permissions', color: '#d97706' }
  ];

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/dashboard/stats`).subscribe({
      next: res => this.stats.set(res.data),
      error: () => {} // silently fail
    });
  }
}
