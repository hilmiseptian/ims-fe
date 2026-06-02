import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageService } from '../../../core/services/page.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-page-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
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
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Page Name</mat-label>
              <mat-icon matPrefix>article</mat-icon>
              <input
                matInput
                formControlName="name"
                placeholder="e.g. User Management"
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
                placeholder="/users"
              />
              @if (err('route', 'required')) {
                <mat-error>Required</mat-error>
              }
              @if (err('route', 'pattern')) {
                <mat-error>Must start with /</mat-error>
              }
              @if (backendErrors()['route']) {
                <mat-error>{{ backendErrors()['route'] }}</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Icon (Material)</mat-label>
              <mat-icon matPrefix>{{
                form.get('icon')?.value || 'article'
              }}</mat-icon>
              <input matInput formControlName="icon" placeholder="article" />
              <mat-hint>Material icon name</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sort Order</mat-label>
              <input
                matInput
                type="number"
                formControlName="sort_order"
                min="1"
              />
              @if (err('sort_order', 'required')) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description</mat-label>
            <textarea
              matInput
              formControlName="description"
              rows="3"
              placeholder="Brief description…"
            ></textarea>
          </mat-form-field>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="is_active" color="primary"
              >Active</mat-slide-toggle
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
  backendErrors = signal<Record<string, string>>({});

  form = this.fb.group({
    name: ['', Validators.required],
    route_path: ['', [Validators.required, Validators.pattern(/^\//)]], // was: route
    description: [''],
    icon: ['article'],
    sort_order: [1, Validators.required],
    is_active: [true],
  });

  ngOnInit(): void {
    this.pageId = +this.route.snapshot.params['id'];
    this.isEdit = !!this.pageId;
    if (this.isEdit) this.loadPage();
  }

  loadPage(): void {
    this.loadingData.set(true);
    this.service.getById(this.pageId!).subscribe({
      next: (res) => {
        this.form.patchValue(res.data as any);
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
    const payload: any = this.form.value;
    const req = this.isEdit
      ? this.service.update(this.pageId!, payload)
      : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.notify.success(`Page ${this.isEdit ? 'updated' : 'created'}.`);
        this.router.navigate(['/pages']);
      },
      error: (err) => {
        this.saving.set(false);
        if (err.error?.errors) this.backendErrors.set(err.error.errors);
        else this.notify.error(err.error?.message || 'Save failed.');
      },
    });
  }

  err(field: string, type: string): boolean {
    const c = this.form.get(field);
    return !!(c?.errors?.[type] && c.touched);
  }
}
