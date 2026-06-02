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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { LevelService } from '../../../core/services/level.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { HasPermissionDirective } from '../../../shared/pipes/has-permission.directive';
import { Level } from '../../../core/models';

@Component({
  selector: 'app-level-list',
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
        <h1 class="page-header__title">Levels</h1>
        <p class="page-header__subtitle">Define user roles and access tiers</p>
      </div>
      <ng-container *appHasPermission="'levels.create'">
        <a mat-flat-button color="primary" routerLink="/levels/create">
          <mat-icon>add</mat-icon> Add Level
        </a>
      </ng-container>
    </div>

    <mat-card>
      <div class="table-toolbar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search levels</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchValue" (ngModelChange)="onSearch($event)" placeholder="Level name…">
          @if (searchValue) {
            <button matSuffix mat-icon-button (click)="clearSearch()"><mat-icon>close</mat-icon></button>
          }
        </mat-form-field>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <table mat-table [dataSource]="levels()" class="w-full">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let l">
            <span class="level-name">{{ l.name }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Description</th>
          <td mat-cell *matCellDef="let l">{{ l.description || '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="user_count">
          <th mat-header-cell *matHeaderCellDef>Users</th>
          <td mat-cell *matCellDef="let l">
            <span class="count-badge">{{ l.user_count ?? 0 }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="is_active">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let l">
            <span class="status-chip dot" [class.active]="l.is_active" [class.inactive]="!l.is_active">
              {{ l.is_active ? 'Active' : 'Inactive' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let l">
            <div class="action-btns">
              <ng-container *appHasPermission="'levels.update'">
                <a mat-icon-button [routerLink]="['/levels', l.id, 'edit']" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </a>
              </ng-container>
              <ng-container *appHasPermission="'levels.delete'">
                <button mat-icon-button color="warn" matTooltip="Delete" (click)="confirmDelete(l)">
                  <mat-icon>delete</mat-icon>
                </button>
              </ng-container>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
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
    .table-toolbar { padding: 16px 16px 0; }
    .search-field { width: 280px; }
    .level-name { font-weight: 500; }
    .count-badge {
      display: inline-block;
      min-width: 24px;
      padding: 2px 8px;
      border-radius: 12px;
      background: var(--surface-variant);
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .action-btns { display: flex; gap: 4px; }
  `]
})
export class LevelListComponent implements OnInit {
  private service = inject(LevelService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  columns = ['name', 'description', 'user_count', 'is_active', 'actions'];
  levels = signal<Level[]>([]);
  total = signal(0);
  loading = signal(false);
  searchValue = '';
  page = 1;
  pageSize = 10;
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.load();
    this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page = 1; this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll(this.page, this.pageSize, this.searchValue).subscribe({
      next: res => { this.levels.set(res.data); this.total.set(res.meta.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(v: string): void { this.search$.next(v); }
  clearSearch(): void { this.searchValue = ''; this.search$.next(''); }
  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.load(); }

  confirmDelete(level: Level): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Level',
        message: level.user_count
          ? `Level "${level.name}" has ${level.user_count} user(s) assigned. Soft-delete will deactivate it.`
          : `Delete level "${level.name}"?`,
        confirmLabel: 'Delete',
        dangerous: true
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.service.delete(level.id).subscribe({
          next: () => { this.notify.success('Level deleted.'); this.load(); },
          error: err => this.notify.error(err.error?.message || 'Delete failed.')
        });
      }
    });
  }
}
