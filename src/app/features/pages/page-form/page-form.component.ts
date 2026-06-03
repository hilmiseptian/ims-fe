// src/app/features/pages/page-form/page-form.component.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { PageService } from '../../../core/services/page.service';
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Page } from '../../../core/models';

@Component({
  selector: 'app-page-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">
          {{ isEdit ? 'Edit Page' : 'Create Page' }}
        </h1>
        <p class="page-header__subtitle">
          {{
            isEdit ? 'Update page settings' : 'Register a new application page'
          }}
        </p>
      </div>
      <a mat-button routerLink="/pages"><mat-icon>arrow_back</mat-icon> Back</a>
    </div>

    @if (loadingData()) {
      <div class="loading-overlay"><mat-spinner diameter="40" /></div>
    } @else {
      <div class="form-card" style="max-width:720px">
        @if (isSystem()) {
          <div class="system-notice">
            <mat-icon>shield</mat-icon>
            This is a system page. Route path cannot be changed.
          </div>
        }
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Page Name</mat-label>
              <mat-icon matPrefix>article</mat-icon>
              <input
                matInput
                formControlName="name"
                placeholder="e.g. Inventory"
              />
              @if (err('name', 'required')) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Route / Path</mat-label>
              <mat-icon matPrefix>link</mat-icon>
              <input
                matInput
                formControlName="route_path"
                placeholder="/inventory"
                [readonly]="isSystem()"
              />
              @if (err('route_path', 'required')) {
                <mat-error>Required</mat-error>
              }
              @if (err('route_path', 'pattern')) {
                <mat-error>Must start with /</mat-error>
              }
              @if (backendErrors()['route_path']) {
                <mat-error>{{ backendErrors()['route_path'] }}</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Icon (Material)</mat-label>
              <mat-icon matPrefix>{{
                form.get('icon')?.value || 'article'
              }}</mat-icon>
              <input
                matInput
                formControlName="icon"
                placeholder="inventory_2"
              />
              <mat-hint
                >Material icon name —
                <a href="https://fonts.google.com/icons" target="_blank"
                  >browse icons</a
                ></mat-hint
              >
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sort Order</mat-label>
              <input
                matInput
                type="number"
                formControlName="sort_order"
                min="1"
              />
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Required Permission</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input
                matInput
                formControlName="permission_key"
                placeholder="inventory.view"
              />
              <mat-hint
                >e.g. inventory.view — leave blank for public access</mat-hint
              >
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Parent Page (optional)</mat-label>
              <mat-icon matPrefix>account_tree</mat-icon>
              <mat-select formControlName="parent_id">
                <mat-option [value]="null">— None (top-level) —</mat-option>
                @for (p of allPages(); track p.id) {
                  @if (p.id !== pageId) {
                    <mat-option [value]="p.id">{{ p.name }}</mat-option>
                  }
                }
              </mat-select>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description</mat-label>
            <textarea
              matInput
              formControlName="description"
              rows="2"
              placeholder="Brief description…"
            ></textarea>
          </mat-form-field>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="is_active" color="primary"
              >Active</mat-slide-toggle
            >
            <span class="text-muted"
              >Inactive pages are hidden from all users</span
            >
          </div>

          <div class="form-actions">
            <a mat-button routerLink="/pages">Cancel</a>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="saving()"
            >
              @if (saving()) {
                <mat-spinner diameter="20" />
              } @else {
                <mat-icon>save</mat-icon> {{ isEdit ? 'Update' : 'Create' }}
              }
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [
    `
      .toggle-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .system-notice {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 6px;
        background: rgba(79, 70, 229, 0.08);
        color: var(--accent);
        font-size: 13px;
        margin-bottom: 8px;
      }
    `,
  ],
})
export class PageFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(PageService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  pageId?: number;
  loadingData = signal(false);
  saving = signal(false);
  isSystem = signal(false);
  allPages = signal<Page[]>([]);
  backendErrors = signal<Record<string, string>>({});

  form = this.fb.group({
    name: ['', Validators.required],
    route_path: ['', [Validators.required, Validators.pattern(/^\//)]],
    description: [''],
    icon: ['article'],
    sort_order: [1, Validators.required],
    permission_key: [null as string | null],
    parent_id: [null as number | null],
    is_active: [true],
  });

  ngOnInit(): void {
    this.pageId = +this.route.snapshot.params['id'];
    this.isEdit = !!this.pageId;
    this.loadAllPages();
    if (this.isEdit) this.loadPage();
  }

  loadAllPages(): void {
    this.service.getAll(1, 200).subscribe((res) => this.allPages.set(res.data));
  }

  loadPage(): void {
    this.loadingData.set(true);
    this.service.getById(this.pageId!).subscribe({
      next: (res) => {
        this.form.patchValue(res.data as any);
        this.isSystem.set(res.data.is_system);
        if (res.data.is_system) this.form.get('route_path')!.disable();
        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.backendErrors.set({});
    const payload = this.form.getRawValue();
    const req = this.isEdit
      ? this.service.update(this.pageId!, payload as any)
      : this.service.create(payload as any);
    req.subscribe({
      next: () => {
        this.notify.success(`Page ${this.isEdit ? 'updated' : 'created'}.`);
        this.router.navigate(['/pages']);
      },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 403)
          this.notify.error('System pages have restricted edits.');
        else if (err.error?.errors) this.backendErrors.set(err.error.errors);
        else this.notify.error(err.error?.message || 'Save failed.');
      },
    });
  }

  err(field: string, type: string): boolean {
    const c = this.form.get(field);
    return !!(c?.errors?.[type] && c.touched);
  }
}
