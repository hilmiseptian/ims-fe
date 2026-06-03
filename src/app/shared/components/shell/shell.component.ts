// src/app/shared/components/shell/shell.component.ts

import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { PageService } from '../../../core/services/page.service';
import { MenuItem } from '../../../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="shell" [class.collapsed]="collapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar__brand">
          <div class="brand-icon"><mat-icon>shield</mat-icon></div>
          <span class="brand-name">UAM</span>
        </div>

        <nav class="sidebar__nav">
          @if (menuLoading()) {
            <div class="menu-loading"><mat-spinner diameter="24" /></div>
          } @else {
            @for (item of menuItems(); track item.id) {
              @if (item.children && item.children.length > 0) {
                <!-- Parent with children -->
                <div class="nav-group">
                  <div
                    class="nav-group__header"
                    [matTooltip]="collapsed() ? item.label : ''"
                    matTooltipPosition="right"
                  >
                    <mat-icon class="nav-item__icon">{{ item.icon }}</mat-icon>
                    <span class="nav-item__label">{{ item.label }}</span>
                    <mat-icon class="nav-group__chevron">expand_more</mat-icon>
                  </div>
                  <div class="nav-group__children">
                    @for (child of item.children; track child.id) {
                      <a
                        class="nav-item nav-item--child"
                        [routerLink]="child.route_path"
                        routerLinkActive="nav-item--active"
                      >
                        <mat-icon class="nav-item__icon">{{
                          child.icon
                        }}</mat-icon>
                        <span class="nav-item__label">{{ child.label }}</span>
                      </a>
                    }
                  </div>
                </div>
              } @else {
                <!-- Flat item -->
                <a
                  class="nav-item"
                  [routerLink]="item.route_path"
                  routerLinkActive="nav-item--active"
                  [matTooltip]="collapsed() ? item.label : ''"
                  matTooltipPosition="right"
                >
                  <mat-icon class="nav-item__icon">{{ item.icon }}</mat-icon>
                  <span class="nav-item__label">{{ item.label }}</span>
                </a>
              }
            }
          }
        </nav>

        <div class="sidebar__footer">
          <button class="nav-item collapse-btn" (click)="toggleCollapse()">
            <mat-icon>{{
              collapsed() ? 'chevron_right' : 'chevron_left'
            }}</mat-icon>
            <span class="nav-item__label">Collapse</span>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main">
        <header class="header">
          <div class="header__left">
            <button
              mat-icon-button
              class="mobile-menu-btn"
              (click)="toggleCollapse()"
            >
              <mat-icon>menu</mat-icon>
            </button>
            <div class="breadcrumb-title">{{ currentUser()?.level_name }}</div>
          </div>
          <div class="header__right">
            <button
              mat-button
              [matMenuTriggerFor]="userMenu"
              class="user-button"
            >
              <div class="user-avatar">{{ initials() }}</div>
              <div class="user-info">
                <span class="user-name">{{ currentUser()?.full_name }}</span>
                <span class="user-role">{{ currentUser()?.username }}</span>
              </div>
              <mat-icon>expand_more</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu" xPosition="before">
              <button mat-menu-item disabled>
                <mat-icon>person</mat-icon>
                <span>{{ currentUser()?.email }}</span>
              </button>
              <mat-divider />
              <button mat-menu-item (click)="logout()">
                <mat-icon color="warn">logout</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </div>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      /* (same structural styles as before, additions below) */
      .shell {
        display: flex;
        height: 100vh;
        overflow: hidden;
      }
      .sidebar {
        width: var(--sidebar-width);
        min-width: var(--sidebar-width);
        background: #0f1117;
        color: #e2e8f0;
        display: flex;
        flex-direction: column;
        transition:
          width 0.25s ease,
          min-width 0.25s ease;
        overflow: hidden;
      }
      .collapsed .sidebar {
        width: var(--sidebar-collapsed-width);
        min-width: var(--sidebar-collapsed-width);
      }
      .sidebar__brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        white-space: nowrap;
        overflow: hidden;
      }
      .brand-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .brand-icon mat-icon {
        font-size: 20px;
        color: white;
      }
      .brand-name {
        font-size: 17px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: white;
        transition: opacity 0.2s;
      }
      .collapsed .brand-name {
        opacity: 0;
        width: 0;
      }
      .sidebar__nav {
        flex: 1;
        padding: 12px 10px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .menu-loading {
        display: flex;
        justify-content: center;
        padding: 24px;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        color: #94a3b8;
        text-decoration: none;
        cursor: pointer;
        background: none;
        border: none;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        transition:
          background 0.15s,
          color 0.15s;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        font-weight: 500;
      }
      .nav-item:hover {
        background: rgba(255, 255, 255, 0.06);
        color: white;
      }
      .nav-item--active {
        background: var(--accent-light);
        color: var(--accent);
      }
      .nav-item--child {
        padding-left: 36px;
        font-size: 13px;
      }
      .nav-item__icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
      .nav-item__label {
        transition: opacity 0.2s;
      }
      .collapsed .nav-item__label {
        opacity: 0;
        width: 0;
        overflow: hidden;
      }
      .nav-group__header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        color: #94a3b8;
        cursor: pointer;
        transition:
          background 0.15s,
          color 0.15s;
      }
      .nav-group__header:hover {
        background: rgba(255, 255, 255, 0.06);
        color: white;
      }
      .nav-group__chevron {
        margin-left: auto;
        font-size: 18px;
      }
      .sidebar__footer {
        padding: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .collapse-btn {
        color: #64748b;
      }
      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .header {
        height: var(--header-height);
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        gap: 16px;
        flex-shrink: 0;
      }
      .header__left {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .mobile-menu-btn {
        display: none;
      }
      .breadcrumb-title {
        font-size: 13px;
        font-weight: 500;
        background: var(--accent-light);
        color: var(--accent);
        padding: 3px 10px;
        border-radius: 20px;
      }
      .header__right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .user-button {
        display: flex;
        align-items: center;
        gap: 10px;
        height: auto !important;
        padding: 6px 10px !important;
        border-radius: 8px !important;
      }
      .user-avatar {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: var(--accent);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
      }
      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.3;
      }
      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .user-role {
        font-size: 11px;
        color: var(--text-secondary);
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 28px;
      }
      @media (max-width: 768px) {
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
          transform: translateX(-100%);
          transition: transform 0.25s ease;
        }
        .shell:not(.collapsed) .sidebar {
          transform: translateX(0);
          width: var(--sidebar-width);
          min-width: var(--sidebar-width);
        }
        .collapsed .sidebar {
          transform: translateX(-100%);
        }
        .mobile-menu-btn {
          display: inline-flex !important;
        }
        .content {
          padding: 16px;
        }
      }
    `,
  ],
})
export class ShellComponent implements OnInit {
  private auth = inject(AuthService);
  private pageService = inject(PageService);

  collapsed = signal(false);
  menuLoading = signal(true);
  menuItems = signal<MenuItem[]>([]);

  currentUser = this.auth.currentUser;

  initials = computed(() => {
    const name = this.currentUser()?.full_name || '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  });

  ngOnInit(): void {
    this.loadMenu();
  }

  loadMenu(): void {
    this.menuLoading.set(true);
    this.pageService.getMenu().subscribe({
      next: (items) => {
        this.menuItems.set(items);
        this.menuLoading.set(false);
      },
      error: () => this.menuLoading.set(false),
    });
  }

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }
  logout(): void {
    this.auth.logout();
  }
}
