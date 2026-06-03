// src/app/features/permissions/permissions.component.ts  — FULL REDESIGN

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { forkJoin } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { LevelService } from '../../core/services/level.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { Permission, Level, User } from '../../core/models';

interface ModuleGroup {
  module: string;
  permissions: Permission[];
  assignedCount: number;
  totalCount: number;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatInputModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatBadgeModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Permission Management</h1>
        <p class="page-header__subtitle">
          Assign permissions to levels and configure user overrides
        </p>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><mat-spinner diameter="48" /></div>
    } @else {
      <mat-tab-group animationDuration="150ms">
        <!-- ─── Level Permissions ──────────────────────────────────── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">layers</mat-icon> Level Permissions
          </ng-template>

          <div class="tab-content">
            <div class="two-panel">
              <!-- Left: Level List -->
              <div class="level-panel">
                <div class="level-panel__header">
                  <h3>Levels</h3>
                  <span class="text-muted">{{ levels().length }} roles</span>
                </div>
                <div class="level-list">
                  @for (level of levels(); track level.id) {
                    <div
                      class="level-card"
                      [class.level-card--active]="selectedLevelId === level.id"
                      (click)="selectLevel(level.id)"
                    >
                      <div class="level-card__info">
                        <span class="level-card__name">{{ level.name }}</span>
                        <span class="level-card__count">
                          {{ getLevelPermCount(level.id) }}/{{
                            allPermissions().length
                          }}
                          permissions
                        </span>
                      </div>
                      <div class="level-card__bar">
                        <div
                          class="level-card__fill"
                          [style.width.%]="getLevelPermPercent(level.id)"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Right: Permission Groups for selected level -->
              <div class="perm-panel">
                @if (!selectedLevelId) {
                  <div class="empty-prompt">
                    <mat-icon>arrow_back</mat-icon>
                    <p>Select a level to manage its permissions</p>
                  </div>
                } @else {
                  <div class="perm-panel__header">
                    <div>
                      <h3>{{ selectedLevelName() }}</h3>
                      <span class="text-muted">
                        {{ getLevelPermCount(selectedLevelId) }} of
                        {{ allPermissions().length }} permissions granted
                      </span>
                    </div>
                    <div class="perm-panel__actions">
                      <button
                        mat-stroked-button
                        (click)="toggleAllForLevel(true)"
                      >
                        <mat-icon>check_box</mat-icon> Grant All
                      </button>
                      <button
                        mat-stroked-button
                        (click)="toggleAllForLevel(false)"
                      >
                        <mat-icon>check_box_outline_blank</mat-icon> Revoke All
                      </button>
                      @if (savingLevel()) {
                        <mat-progress-bar
                          mode="indeterminate"
                          style="position:absolute;bottom:0;left:0;right:0"
                        />
                      }
                    </div>
                  </div>

                  @if (savingLevel()) {
                    <mat-progress-bar mode="indeterminate" class="save-bar" />
                  }

                  <mat-form-field appearance="outline" class="perm-search">
                    <mat-label>Search permissions</mat-label>
                    <mat-icon matPrefix>search</mat-icon>
                    <input
                      matInput
                      [(ngModel)]="permSearch"
                      placeholder="e.g. users.create"
                    />
                  </mat-form-field>

                  <mat-accordion multi>
                    @for (group of filteredModuleGroups(); track group.module) {
                      <mat-expansion-panel [expanded]="true">
                        <mat-expansion-panel-header>
                          <mat-panel-title>
                            <mat-icon class="module-icon">{{
                              moduleIcon(group.module)
                            }}</mat-icon>
                            {{ group.module | titlecase }}
                          </mat-panel-title>
                          <mat-panel-description>
                            <span class="module-stats">
                              {{ group.assignedCount }}/{{ group.totalCount }}
                            </span>
                            <button
                              mat-icon-button
                              size="small"
                              (click)="
                                $event.stopPropagation();
                                toggleModule(group.module, true)
                              "
                              matTooltip="Grant all in module"
                            >
                              <mat-icon style="font-size:18px"
                                >done_all</mat-icon
                              >
                            </button>
                            <button
                              mat-icon-button
                              size="small"
                              (click)="
                                $event.stopPropagation();
                                toggleModule(group.module, false)
                              "
                              matTooltip="Revoke all in module"
                            >
                              <mat-icon style="font-size:18px"
                                >remove_done</mat-icon
                              >
                            </button>
                          </mat-panel-description>
                        </mat-expansion-panel-header>

                        <div class="perm-grid">
                          @for (perm of group.permissions; track perm.id) {
                            <div class="perm-item">
                              <mat-checkbox
                                color="primary"
                                [checked]="
                                  hasLevelPermission(selectedLevelId, perm.name)
                                "
                                (change)="
                                  toggleLevelPermission(
                                    selectedLevelId,
                                    perm.name,
                                    $event.checked
                                  )
                                "
                              >
                                <div class="perm-item__content">
                                  <code class="perm-item__key">{{
                                    perm.action
                                  }}</code>
                                  <span class="perm-item__desc">{{
                                    perm.description
                                  }}</span>
                                </div>
                              </mat-checkbox>
                            </div>
                          }
                        </div>
                      </mat-expansion-panel>
                    }
                  </mat-accordion>

                  <div class="matrix-actions">
                    <button
                      mat-flat-button
                      color="primary"
                      (click)="saveLevelPermissions()"
                      [disabled]="savingLevel()"
                    >
                      <mat-icon>save</mat-icon> Save
                      {{ selectedLevelName() }} Permissions
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- ─── User Overrides ─────────────────────────────────────── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">person</mat-icon> User Overrides
          </ng-template>

          <div class="tab-content">
            <div class="user-selector">
              <mat-form-field appearance="outline" style="width:400px">
                <mat-label>Select User</mat-label>
                <mat-icon matPrefix>person_search</mat-icon>
                <mat-select
                  [(ngModel)]="selectedUserId"
                  (ngModelChange)="onUserSelect($event)"
                >
                  @for (user of users(); track user.id) {
                    <mat-option [value]="user.id">
                      {{ user.full_name }} — <em>{{ user.username }}</em> ({{
                        user.level_name
                      }})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            @if (!selectedUserId) {
              <div class="empty-prompt">
                <mat-icon>person_search</mat-icon>
                <p>Select a user to manage their permission overrides</p>
              </div>
            } @else {
              @if (savingUser()) {
                <mat-progress-bar mode="indeterminate" class="save-bar" />
              }

              <div class="override-legend">
                <span
                  class="legend-dot"
                  style="background:var(--success)"
                ></span>
                Additional (grant extra)
                <span
                  class="legend-dot"
                  style="background:var(--danger); margin-left:16px"
                ></span>
                Excluded (deny inherited)
                <span
                  style="margin-left:16px; color:var(--text-secondary); font-size:12px"
                >
                  Unchecked = inherited from level
                </span>
              </div>

              <mat-accordion multi>
                @for (group of moduleGroups(); track group.module) {
                  <mat-expansion-panel [expanded]="true">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon class="module-icon">{{
                          moduleIcon(group.module)
                        }}</mat-icon>
                        {{ group.module | titlecase }}
                      </mat-panel-title>
                    </mat-expansion-panel-header>

                    <table class="override-table">
                      <thead>
                        <tr>
                          <th>Permission</th>
                          <th class="center">Inherited</th>
                          <th class="center">Additional</th>
                          <th class="center">Excluded</th>
                          <th class="center">Effective</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (perm of group.permissions; track perm.id) {
                          <tr>
                            <td>
                              <code>{{ perm.name }}</code>
                              <small class="perm-desc">{{
                                perm.description
                              }}</small>
                            </td>
                            <td class="center">
                              @if (levelPermsForUser().has(perm.name)) {
                                <mat-icon class="check-icon inherited"
                                  >check_circle</mat-icon
                                >
                              } @else {
                                <mat-icon class="check-icon missing"
                                  >radio_button_unchecked</mat-icon
                                >
                              }
                            </td>
                            <td class="center">
                              <mat-checkbox
                                color="primary"
                                [checked]="userAdditional().has(perm.name)"
                                [disabled]="userExcluded().has(perm.name)"
                                (change)="
                                  toggleUserAdditional(
                                    perm.name,
                                    $event.checked
                                  )
                                "
                              />
                            </td>
                            <td class="center">
                              <mat-checkbox
                                color="warn"
                                [checked]="userExcluded().has(perm.name)"
                                [disabled]="userAdditional().has(perm.name)"
                                (change)="
                                  toggleUserExcluded(perm.name, $event.checked)
                                "
                              />
                            </td>
                            <td class="center">
                              @if (isEffective(perm.name)) {
                                <span class="eff-badge eff-badge--allowed"
                                  >Allowed</span
                                >
                              } @else {
                                <span class="eff-badge eff-badge--denied"
                                  >Denied</span
                                >
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </mat-expansion-panel>
                }
              </mat-accordion>

              <div class="matrix-actions">
                <button
                  mat-flat-button
                  color="primary"
                  (click)="saveUserPermissions()"
                  [disabled]="savingUser()"
                >
                  <mat-icon>save</mat-icon> Save User Overrides
                </button>
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    }
  `,
  styles: [
    `
      .tab-content {
        padding: 24px 0;
      }
      .tab-icon {
        margin-right: 6px;
        font-size: 18px;
        vertical-align: middle;
      }
      .save-bar {
        margin-bottom: 16px;
        border-radius: 4px;
      }

      /* Two-panel layout */
      .two-panel {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 20px;
        min-height: 500px;
      }

      .level-panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .level-panel__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--border);
      }
      .level-panel__header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
      }
      .level-list {
        overflow-y: auto;
      }
      .level-card {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--border);
        transition: background 0.15s;
      }
      .level-card:hover {
        background: var(--surface-variant);
      }
      .level-card--active {
        background: var(--accent-light);
        border-right: 3px solid var(--accent);
      }
      .level-card__info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .level-card__name {
        font-weight: 600;
        font-size: 13px;
      }
      .level-card__count {
        font-size: 11px;
        color: var(--text-secondary);
      }
      .level-card__bar {
        height: 4px;
        background: var(--border);
        border-radius: 2px;
        overflow: hidden;
      }
      .level-card__fill {
        height: 100%;
        background: var(--accent);
        transition: width 0.3s;
      }

      .perm-panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 20px;
        overflow-y: auto;
      }
      .perm-panel__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        position: relative;
        padding-bottom: 4px;
      }
      .perm-panel__header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
      }
      .perm-panel__actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .perm-search {
        width: 100%;
        margin-bottom: 16px;
      }

      .module-icon {
        font-size: 18px;
        margin-right: 8px;
        color: var(--accent);
        vertical-align: middle;
      }
      .module-stats {
        font-size: 12px;
        font-weight: 600;
        color: var(--accent);
        background: var(--accent-light);
        padding: 2px 8px;
        border-radius: 12px;
        margin-right: 4px;
      }

      .perm-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 8px;
        padding: 8px 0;
      }
      .perm-item {
        padding: 6px 0;
      }
      .perm-item__content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .perm-item__key {
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        background: var(--surface-variant);
        padding: 2px 6px;
        border-radius: 3px;
      }
      .perm-item__desc {
        font-size: 11px;
        color: var(--text-secondary);
      }

      /* User overrides table */
      .user-selector {
        margin-bottom: 20px;
      }
      .override-legend {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 16px;
        font-size: 12px;
      }
      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }

      .override-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .override-table th,
      .override-table td {
        padding: 8px 12px;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      .override-table th {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
        font-weight: 600;
      }
      .override-table tr:last-child td {
        border-bottom: none;
      }
      .center {
        text-align: center;
      }
      .perm-desc {
        display: block;
        font-size: 11px;
        color: var(--text-secondary);
      }

      .check-icon {
        font-size: 18px;
      }
      .check-icon.inherited {
        color: var(--success);
      }
      .check-icon.missing {
        color: var(--border);
      }

      .eff-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      .eff-badge--allowed {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
      }
      .eff-badge--denied {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      .matrix-actions {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
      .empty-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 60px 0;
        color: var(--text-secondary);
      }
      .empty-prompt mat-icon {
        font-size: 48px;
        opacity: 0.3;
      }
      .empty-prompt p {
        margin: 0;
        font-size: 15px;
      }
    `,
  ],
})
export class PermissionsComponent implements OnInit {
  private permService = inject(PermissionService);
  private levelService = inject(LevelService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  loading = signal(true);
  savingLevel = signal(false);
  savingUser = signal(false);

  allPermissions = signal<Permission[]>([]);
  levels = signal<Level[]>([]);
  users = signal<User[]>([]);

  selectedLevelId: number | null = null;
  permSearch = '';

  levelPermissions = signal<Map<number, Set<string>>>(new Map());

  selectedUserId: number | null = null;
  userAdditional = signal<Set<string>>(new Set());
  userExcluded = signal<Set<string>>(new Set());
  levelPermsForUser = signal<Set<string>>(new Set());

  moduleGroups = computed<ModuleGroup[]>(() => {
    const groups = new Map<string, Permission[]>();
    for (const p of this.allPermissions()) {
      if (!groups.has(p.module)) groups.set(p.module, []);
      groups.get(p.module)!.push(p);
    }
    return Array.from(groups.entries()).map(([module, permissions]) => ({
      module,
      permissions,
      assignedCount: 0,
      totalCount: permissions.length,
    }));
  });

  filteredModuleGroups = computed<ModuleGroup[]>(() => {
    const q = this.permSearch.toLowerCase();
    return this.moduleGroups()
      .map((g) => ({
        ...g,
        permissions: q
          ? g.permissions.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q),
            )
          : g.permissions,
        assignedCount: this.selectedLevelId
          ? g.permissions.filter((p) =>
              this.hasLevelPermission(this.selectedLevelId!, p.name),
            ).length
          : 0,
      }))
      .filter((g) => g.permissions.length > 0);
  });

  selectedLevelName = computed(
    () => this.levels().find((l) => l.id === this.selectedLevelId)?.name ?? '',
  );

  ngOnInit(): void {
    forkJoin([
      this.permService.getAllPermissions(),
      this.levelService.getAllActive(),
      this.userService.getAll(1, 200),
    ]).subscribe({
      next: ([perms, levels, users]) => {
        this.allPermissions.set(perms.data);
        this.levels.set(levels.data);
        this.users.set(users.data);
        this.loadAllLevelPermissions();
      },
      error: () => this.loading.set(false),
    });
  }

  private loadAllLevelPermissions(): void {
    const calls = this.levels().map((l) =>
      this.permService.getLevelPermissions(l.id),
    );
    forkJoin(calls).subscribe({
      next: (results) => {
        const map = new Map<number, Set<string>>();
        results.forEach((res, i) => {
          map.set(this.levels()[i].id, new Set(res.data.assigned_permissions));
        });
        this.levelPermissions.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectLevel(id: number): void {
    this.selectedLevelId = id;
    this.permSearch = '';
  }

  getLevelPermCount(levelId: number): number {
    return this.levelPermissions().get(levelId)?.size ?? 0;
  }

  getLevelPermPercent(levelId: number): number {
    const total = this.allPermissions().length;
    return total ? (this.getLevelPermCount(levelId) / total) * 100 : 0;
  }

  hasLevelPermission(levelId: number, permName: string): boolean {
    return this.levelPermissions().get(levelId)?.has(permName) ?? false;
  }

  toggleLevelPermission(
    levelId: number,
    permName: string,
    checked: boolean,
  ): void {
    const map = new Map(this.levelPermissions());
    const set = new Set(map.get(levelId) ?? []);
    checked ? set.add(permName) : set.delete(permName);
    map.set(levelId, set);
    this.levelPermissions.set(map);
  }

  toggleAllForLevel(grant: boolean): void {
    if (!this.selectedLevelId) return;
    const map = new Map(this.levelPermissions());
    map.set(
      this.selectedLevelId,
      grant ? new Set(this.allPermissions().map((p) => p.name)) : new Set(),
    );
    this.levelPermissions.set(map);
  }

  toggleModule(module: string, grant: boolean): void {
    if (!this.selectedLevelId) return;
    const map = new Map(this.levelPermissions());
    const set = new Set(map.get(this.selectedLevelId) ?? []);
    const modulePerms = this.allPermissions()
      .filter((p) => p.module === module)
      .map((p) => p.name);
    modulePerms.forEach((k) => (grant ? set.add(k) : set.delete(k)));
    map.set(this.selectedLevelId, set);
    this.levelPermissions.set(map);
  }

  saveLevelPermissions(): void {
    if (!this.selectedLevelId) return;
    this.savingLevel.set(true);
    this.permService
      .updateLevelPermissions(
        this.selectedLevelId,
        Array.from(this.levelPermissions().get(this.selectedLevelId) ?? []),
      )
      .subscribe({
        next: () => {
          this.notify.success('Level permissions saved.');
          this.savingLevel.set(false);
        },
        error: () => {
          this.notify.error('Save failed.');
          this.savingLevel.set(false);
        },
      });
  }

  onUserSelect(userId: number): void {
    this.userAdditional.set(new Set());
    this.userExcluded.set(new Set());
    this.permService.getUserPermissions(userId).subscribe((res) => {
      this.userAdditional.set(new Set<string>(res.data.user_additions));
      this.userExcluded.set(new Set<string>(res.data.user_exclusions));
      const user = this.users().find((u) => u.id === userId);
      this.levelPermsForUser.set(
        user
          ? (this.levelPermissions().get(user.level_id) ?? new Set<string>())
          : new Set<string>(),
      );
    });
  }

  toggleUserAdditional(permName: string, checked: boolean): void {
    const s = new Set(this.userAdditional());
    checked ? s.add(permName) : s.delete(permName);
    this.userAdditional.set(s);
  }

  toggleUserExcluded(permName: string, checked: boolean): void {
    const s = new Set(this.userExcluded());
    checked ? s.add(permName) : s.delete(permName);
    this.userExcluded.set(s);
  }

  isEffective(permName: string): boolean {
    if (this.userExcluded().has(permName)) return false;
    return (
      this.levelPermsForUser().has(permName) ||
      this.userAdditional().has(permName)
    );
  }

  saveUserPermissions(): void {
    if (!this.selectedUserId) return;
    this.savingUser.set(true);
    forkJoin([
      this.permService.updateUserAdditions(
        this.selectedUserId,
        Array.from(this.userAdditional()),
      ),
      this.permService.updateUserExclusions(
        this.selectedUserId,
        Array.from(this.userExcluded()),
      ),
    ]).subscribe({
      next: () => {
        this.notify.success('User overrides saved.');
        this.savingUser.set(false);
      },
      error: () => {
        this.notify.error('Save failed.');
        this.savingUser.set(false);
      },
    });
  }

  moduleIcon(module: string): string {
    const icons: Record<string, string> = {
      dashboard: 'dashboard',
      users: 'people',
      levels: 'layers',
      pages: 'article',
      permissions: 'admin_panel_settings',
      inventory: 'inventory_2',
      purchasing: 'shopping_cart',
      sales: 'point_of_sale',
    };
    return icons[module] ?? 'extension';
  }
}
