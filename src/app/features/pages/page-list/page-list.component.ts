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
import { PageService } from '../../../core/services/page.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { HasPermissionDirective } from '../../../shared/pipes/has-permission.directive';
import { Page } from '../../../core/models';

@Component({
  selector: 'app-page-list',
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
        <h1 class="page-header__title">Pages</h1>
        <p class="page-header__subtitle">Manage application pages and navigation routes</p>
      </div>
      <ng-container *appHasPermission="'pages.create'">
        <a mat-flat-button color="primary" routerLink="/pages/create">
          <mat-icon>add</mat-icon> Add Page
        </a>
      </ng-container>
    </div>

    <mat-card>
      <div class="table-toolbar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search pages</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchValue" (ngModelChange)="onSearch($event)" placeholder="Page name or route…">
        </mat-form-field>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <table mat-table [dataSource]="pages()" class="w-full">
        <ng-container matColumnDef="sort_order">
          <th mat-header-cell *matHeaderCellDef>#</th>
          <td mat-cell *matCellDef="let p">
            <span class="order-badge">{{ p.sort_order }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Page Name</th>
          <td mat-cell *matCellDef="let p">
            <div class="page-cell">
              <div class="page-icon">
                <mat-icon>{{ p.icon || 'article' }}</mat-icon>
              </div>
              <div>
                <div class="page-name">{{ p.name }}</div>
                <div class="page-desc">{{ p.description }}</div>
              </div>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="route">
          <th mat-header-cell *matHeaderCellDef>Route</th>
          <td mat-cell *matCellDef="let p">
            <code class="mono">{{ p.route }}</code>
          </td>
        </ng-container>

        <ng-container matColumnDef="is_active">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let p">
            <span class="status-chip dot" [class.active]="p.is_active" [class.inactive]="!p.is_active">
              {{ p.is_active ? 'Active' : 'Inactive' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let p">
            <div class="action-btns">
              <ng-container *appHasPermission="'pages.update'">
                <a mat-icon-button [routerLink]="['/pages', p.id, 'edit']" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </a>
              </ng-container>
              <ng-container *appHasPermission="'pages.delete'">
                <button mat-icon-button color="warn" matTooltip="Delete" (click)="confirmDelete(p)">
                  <mat-icon>delete</mat-icon>
                </button>
              </ng-container>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>

      <mat-paginator [length]="total()" [pageSize]="pageSize" [pageSizeOptions]="[10, 25, 50]"
        (page)="onPage($event)" showFirstLastButtons />
    </mat-card>
  `,
  styles: [`
    .table-toolbar { padding: 16px 16px 0; }
    .search-field { width: 280px; }
    .order-badge {
      width: 28px; height: 28px;
      border-radius: 6px;
      background: var(--surface-variant);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: var(--text-secondary);
    }
    .page-cell { display: flex; align-items: center; gap: 10px; }
    .page-icon {
      width: 34px; height: 34px;
      border-radius: 8px; background: var(--accent-light);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: var(--accent); font-size: 18px; }
    }
    .page-name { font-weight: 500; }
    .page-desc { font-size: 12px; color: var(--text-secondary); }
    .mono { font-family: 'DM Mono', monospace; font-size: 12px; background: var(--surface-variant); padding: 2px 8px; border-radius: 4px; }
    .action-btns { display: flex; gap: 4px; }
  `]
})
export class PageListComponent implements OnInit {
  private service = inject(PageService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  columns = ['sort_order', 'name', 'route', 'is_active', 'actions'];
  pages = signal<Page[]>([]);
  total = signal(0);
  loading = signal(false);
  searchValue = '';
  page = 1;
  pageSize = 10;
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.load();
    this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => { this.page = 1; this.load(); });
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll(this.page, this.pageSize, this.searchValue).subscribe({
      next: res => { this.pages.set(res.data); this.total.set(res.meta.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(v: string): void { this.search$.next(v); }
  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.load(); }

  confirmDelete(page: Page): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Page', message: `Delete page "${page.name}"?`, confirmLabel: 'Delete', dangerous: true }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) this.service.delete(page.id).subscribe({
        next: () => { this.notify.success('Page deleted.'); this.load(); },
        error: err => this.notify.error(err.error?.message || 'Delete failed.')
      });
    });
  }
}
