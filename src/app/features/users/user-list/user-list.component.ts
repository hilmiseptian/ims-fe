import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { HasPermissionDirective } from '../../../shared/pipes/has-permission.directive';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatCardModule, MatProgressBarModule,
    MatTooltipModule, HasPermissionDirective
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Users</h1>
        <p class="page-header__subtitle">Manage user accounts and roles</p>
      </div>
      <ng-container *appHasPermission="'users.create'">
        <a mat-flat-button color="primary" routerLink="/users/create">
          <mat-icon>add</mat-icon> Add User
        </a>
      </ng-container>
    </div>

    <mat-card>
      <div class="table-toolbar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search users</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchValue"
            (ngModelChange)="onSearch($event)"
            placeholder="Name, username or email…">
          @if (searchValue) {
            <button matSuffix mat-icon-button (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <table mat-table [dataSource]="users()" class="w-full">
        <ng-container matColumnDef="full_name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let u">
            <div class="user-cell">
              <div class="user-avatar-sm">{{ initials(u.full_name) }}</div>
              <div>
                <div class="user-name">{{ u.full_name }}</div>
                <div class="user-sub">{{ u.email }}</div>
              </div>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Username</th>
          <td mat-cell *matCellDef="let u">
            <code class="mono">{{ u.username }}</code>
          </td>
        </ng-container>

        <ng-container matColumnDef="level_name">
          <th mat-header-cell *matHeaderCellDef>Level</th>
          <td mat-cell *matCellDef="let u">
            <span class="level-chip">{{ u.level_name }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="is_active">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let u">
            <span class="status-chip dot" [class.active]="u.is_active" [class.inactive]="!u.is_active">
              {{ u.is_active ? 'Active' : 'Inactive' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let u">
            <div class="action-btns">
              <ng-container *appHasPermission="'users.update'">
                <a mat-icon-button [routerLink]="['/users', u.id, 'edit']" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </a>
              </ng-container>
              <ng-container *appHasPermission="'users.delete'">
                <button mat-icon-button color="warn" matTooltip="Delete" (click)="confirmDelete(u)">
                  <mat-icon>delete</mat-icon>
                </button>
              </ng-container>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>

        @if (!loading() && users().length === 0) {
          <tr class="mat-row">
            <td [attr.colspan]="columns.length" class="empty-state">
              <mat-icon>people_outline</mat-icon>
              <span>No users found</span>
            </td>
          </tr>
        }
      </table>

      <mat-paginator
        [length]="total()"
        [pageSize]="pageSize"
        [pageSizeOptions]="[10, 25, 50]"
        (page)="onPage($event)"
        showFirstLastButtons />
    </mat-card>
  `,
  styles: [`
    .table-toolbar {
      padding: 16px 16px 0;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .search-field { width: 320px; }

    .user-cell { display: flex; align-items: center; gap: 10px; }

    .user-avatar-sm {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: var(--accent);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      flex-shrink: 0;
    }

    .user-name { font-weight: 500; }
    .user-sub { font-size: 12px; color: var(--text-secondary); }
    .mono { font-family: 'DM Mono', monospace; font-size: 13px; background: var(--surface-variant); padding: 2px 6px; border-radius: 4px; }

    .level-chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      background: var(--surface-variant);
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .action-btns { display: flex; gap: 4px; }

    .empty-state {
      text-align: center;
      padding: 48px 0;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      mat-icon { font-size: 40px; opacity: 0.4; }
    }
  `]
})
export class UserListComponent implements OnInit {
  private service = inject(UserService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  columns = ['full_name', 'username', 'level_name', 'is_active', 'actions'];
  users = signal<User[]>([]);
  total = signal(0);
  loading = signal(false);
  searchValue = '';
  page = 1;
  pageSize = 10;

  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.load();
    this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll(this.page, this.pageSize, this.searchValue).subscribe({
      next: res => {
        this.users.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(val: string): void { this.search$.next(val); }
  clearSearch(): void { this.searchValue = ''; this.search$.next(''); }
  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.load(); }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  confirmDelete(user: User): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Delete "${user.full_name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        dangerous: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.deleteUser(user.id);
    });
  }

  private deleteUser(id: number): void {
    this.service.delete(id).subscribe({
      next: () => { this.notify.success('User deleted.'); this.load(); },
      error: err => this.notify.error(err.error?.message || 'Delete failed.')
    });
  }
}
