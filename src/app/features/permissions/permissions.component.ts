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
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { LevelService } from '../../core/services/level.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { Permission, Level, User } from '../../core/models';

interface ModuleGroup {
  module: string;
  permissions: Permission[];
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
    MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Permission Management</h1>
        <p class="page-header__subtitle">
          Assign action-based permissions to levels and users
        </p>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><mat-spinner diameter="48" /></div>
    } @else {
      <mat-tab-group animationDuration="150ms" [dynamicHeight]="false">
        <!-- ─── Level Permissions ─── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">layers</mat-icon>
            Level Permissions
          </ng-template>

          <div class="tab-content">
            <p class="section-desc">
              Define which actions each level can perform. Users inherit all
              permissions from their assigned level.
            </p>

            @if (savingLevel()) {
              <mat-progress-bar mode="indeterminate" class="save-bar" />
            }

            <div class="matrix-scroll">
              <table class="perm-matrix">
                <thead>
                  <tr>
                    <th class="perm-col">Permission</th>
                    @for (level of levels(); track level.id) {
                      <th class="level-col">
                        <div class="level-head">{{ level.name }}</div>
                        <div class="level-toggle">
                          <button
                            mat-stroked-button
                            class="toggle-all-btn"
                            (click)="toggleAll(level.id, true)"
                          >
                            All
                          </button>
                          <button
                            mat-stroked-button
                            class="toggle-all-btn"
                            (click)="toggleAll(level.id, false)"
                          >
                            None
                          </button>
                        </div>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (group of moduleGroups(); track group.module) {
                    <tr class="module-header-row">
                      <td [attr.colspan]="levels().length + 1">
                        <div class="module-label">
                          <mat-icon>{{ moduleIcon(group.module) }}</mat-icon>
                          {{ group.module | titlecase }}
                        </div>
                      </td>
                    </tr>
                    @for (perm of group.permissions; track perm.id) {
                      <tr class="perm-row">
                        <td class="perm-name">
                          <code>{{ perm.name }}</code>
                          <span class="perm-desc">{{ perm.description }}</span>
                        </td>
                        @for (level of levels(); track level.id) {
                          <td class="check-cell">
                            <mat-checkbox
                              [checked]="
                                hasLevelPermission(level.id, perm.name)
                              "
                              (change)="
                                toggleLevelPermission(
                                  level.id,
                                  perm.name,
                                  $event.checked
                                )
                              "
                              color="primary"
                            />
                          </td>
                        }
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            <div class="matrix-actions">
              <button
                mat-flat-button
                color="primary"
                (click)="saveLevelPermissions()"
                [disabled]="savingLevel()"
              >
                <mat-icon>save</mat-icon> Save Level Permissions
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- ─── User Permission Overrides ─── -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">person</mat-icon>
            User Overrides
          </ng-template>

          <div class="tab-content">
            <p class="section-desc">
              Grant additional permissions to specific users or exclude
              inherited level permissions.
            </p>

            <div class="user-selector">
              <mat-form-field appearance="outline">
                <mat-label>Select User</mat-label>
                <mat-icon matPrefix>person</mat-icon>
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

            @if (selectedUserId) {
              @if (savingUser()) {
                <mat-progress-bar mode="indeterminate" class="save-bar" />
              }

              <div class="override-legend">
                <span class="legend-item"
                  ><span class="dot green"></span> Additional (grant)</span
                >
                <span class="legend-item"
                  ><span class="dot red"></span> Excluded (deny)</span
                >
                <span class="legend-item muted"
                  >Unchecked = inherited from level</span
                >
              </div>

              <div class="matrix-scroll">
                <table class="perm-matrix">
                  <thead>
                    <tr>
                      <th class="perm-col">Permission</th>
                      <th class="override-col">Additional</th>
                      <th class="override-col">Excluded</th>
                      <th class="perm-col">Effective</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (group of moduleGroups(); track group.module) {
                      <tr class="module-header-row">
                        <td colspan="4">
                          <div class="module-label">
                            <mat-icon>{{ moduleIcon(group.module) }}</mat-icon>
                            {{ group.module | titlecase }}
                          </div>
                        </td>
                      </tr>
                      @for (perm of group.permissions; track perm.id) {
                        <tr class="perm-row">
                          <td class="perm-name">
                            <code>{{ perm.name }}</code>
                          </td>
                          <td class="check-cell">
                            <mat-checkbox
                              color="primary"
                              [checked]="userAdditional().has(perm.name)"
                              [disabled]="userExcluded().has(perm.name)"
                              (change)="
                                toggleUserAdditional(perm.name, $event.checked)
                              "
                            />
                          </td>
                          <td class="check-cell">
                            <mat-checkbox
                              color="warn"
                              [checked]="userExcluded().has(perm.name)"
                              [disabled]="userAdditional().has(perm.name)"
                              (change)="
                                toggleUserExcluded(perm.name, $event.checked)
                              "
                            />
                          </td>
                          <td>
                            @if (isEffective(perm.name)) {
                              <span
                                class="status-chip active dot"
                                style="font-size:11px"
                                >Allowed</span
                              >
                            } @else {
                              <span
                                class="status-chip inactive dot"
                                style="font-size:11px"
                                >Denied</span
                              >
                            }
                          </td>
                        </tr>
                      }
                    }
                  </tbody>
                </table>
              </div>

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

            @if (!selectedUserId) {
              <div class="empty-prompt">
                <mat-icon>person_search</mat-icon>
                <p>Select a user above to manage their permission overrides</p>
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
      .section-desc {
        color: var(--text-secondary);
        margin: 0 0 20px;
      }
      .save-bar {
        margin-bottom: 16px;
        border-radius: 4px;
      }

      /* ─── Matrix ─── */
      .matrix-scroll {
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: var(--radius);
      }

      .perm-matrix {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        background: var(--surface);

        th,
        td {
          padding: 0 16px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        th {
          background: var(--surface-variant);
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        tr:last-child td {
          border-bottom: none;
        }
      }

      .perm-col {
        min-width: 220px;
      }
      .level-col {
        min-width: 120px;
        text-align: center;
      }
      .override-col {
        min-width: 100px;
        text-align: center;
      }

      .level-head {
        margin-bottom: 4px;
      }
      .level-toggle {
        display: flex;
        gap: 4px;
        justify-content: center;
        padding-bottom: 6px;
      }
      .toggle-all-btn {
        font-size: 11px !important;
        padding: 0 8px !important;
        height: 24px !important;
        min-width: unset !important;
      }

      .module-header-row td {
        background: #f8f9fc;
        padding: 6px 16px;
        border-bottom: 1px solid var(--border);
      }

      .module-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--accent);
        mat-icon {
          font-size: 16px;
        }
      }

      .perm-row {
        transition: background 0.1s;
        &:hover {
          background: var(--surface-variant);
        }
      }

      .perm-name {
        display: flex;
        flex-direction: column;
        gap: 2px;
        height: 52px;
        justify-content: center;
        code {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          background: var(--surface-variant);
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }
      }
      .perm-desc {
        font-size: 11px;
        color: var(--text-secondary);
      }

      .check-cell {
        text-align: center;
      }

      /* ─── Matrix actions ─── */
      .matrix-actions {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }

      /* ─── User override ─── */
      .user-selector {
        max-width: 400px;
        margin-bottom: 20px;
      }

      .override-legend {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 16px;
        font-size: 12px;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .dot.green {
        background: var(--success);
      }
      .dot.red {
        background: var(--danger);
      }
      .legend-item.muted {
        color: var(--text-secondary);
      }

      .empty-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 60px 0;
        color: var(--text-secondary);
        mat-icon {
          font-size: 48px;
          opacity: 0.3;
        }
        p {
          margin: 0;
          font-size: 15px;
        }
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

  // levelId -> Set<permissionId>
  levelPermissions = signal<Map<number, Set<string>>>(new Map());

  // User overrides
  selectedUserId: number | null = null;
  userAdditional = signal<Set<String>>(new Set());
  userExcluded = signal<Set<String>>(new Set());
  // effective for selected user (from level)
  levelPermsForUser = signal<Set<String>>(new Set());

  moduleGroups = computed<ModuleGroup[]>(() => {
    const groups = new Map<string, Permission[]>();
    for (const p of this.allPermissions()) {
      if (!groups.has(p.module)) groups.set(p.module, []);
      groups.get(p.module)!.push(p);
    }
    return Array.from(groups.entries()).map(([module, permissions]) => ({
      module,
      permissions,
    }));
  });

  ngOnInit(): void {
    forkJoin([
      this.permService.getAllPermissions(),
      this.levelService.getAll(),
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

  // API returns: { data: { assigned_permissions: ['users.view', ...] } }
  private loadAllLevelPermissions(): void {
    const map = new Map<number, Set<string>>();
    const calls = this.levels().map((level) =>
      this.permService.getLevelPermissions(level.id),
    );
    forkJoin(calls).subscribe({
      next: (results) => {
        results.forEach((res, i) => {
          map.set(this.levels()[i].id, new Set(res.data.assigned_permissions));
        });
        this.levelPermissions.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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

  toggleAll(levelId: number, grant: boolean): void {
    const map = new Map(this.levelPermissions());
    map.set(
      levelId,
      grant
        ? new Set(this.allPermissions().map((p) => p.name)) // use name not id
        : new Set(),
    );
    this.levelPermissions.set(map);
  }

  saveLevelPermissions(): void {
    this.savingLevel.set(true);
    const calls = this.levels().map((level) =>
      this.permService.updateLevelPermissions(
        level.id,
        Array.from(this.levelPermissions().get(level.id) ?? []), // already strings now
      ),
    );
    forkJoin(calls).subscribe({
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
      const lp = user
        ? (this.levelPermissions().get(user.level_id) ?? new Set<string>())
        : new Set<string>();
      this.levelPermsForUser.set(lp);
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
    };
    return icons[module] ?? 'extension';
  }
}
